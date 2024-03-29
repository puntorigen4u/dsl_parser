import helper from './helper'
/**
* dsl_parser: A class for parsing Concepto DSL files, and compile them with the OPEN Framework.
* @name 	dsl_parser
* @module 	dsl_parser
**/

/**
 * A node object representation of a DSL node.
 * @typedef {Object} NodeDSL
 * @property {string} id - Node unique ID.
 * @property {number} level - Indicates the depth level from the center of the dsl map.
 * @property {string} text - Indicates the text defined in the node itself.
 * @property {string} text_rich - Indicates the html defined in the node itself.
 * @property {string} text_note - Indicates the text/html defined in the notes view of the node (if any).
 * @property {string} image - Image link defined as an image within the node.
 * @property {Object} cloud - Cloud information of the node.
 * @property {string} cloud.bgcolor - Background color of cloud.
 * @property {boolean} cloud.used - True if cloud is used, false otherwise. 
 * @property {Arrow[]} arrows - Visual connections of this node with other nodes {@link #module_dsl_parser..Arrow}.
 * @property {NodeDSL[]} nodes - Children nodes of current node.
 * @property {Object} font - Define font, size and styles of node texts.
 * @property {Object} font.face - Font face type used on node.
 * @property {Object} font.size - Font size used on node.
 * @property {Object} font.bold - True if node text is in bold.
 * @property {Object} font.italic - True if node text is in italics.
 * @property {string} style - Style applied to the node.
 * @property {string} color - Text color of node.
 * @property {string} bgcolor - Background color of node.
 * @property {string} link - Link defined on node.
 * @property {string} position - Position in relation of central node (left,right).
 * @property {Object} attributes - Object with each attribute (key is attribute name, value is attribute value).
 * @property {string[]} icons - Array with icon names used in the node.
 * @property {date} date_modified - Date of node when it was last modified.
 * @property {date} date_created - Date of node when it was created.
 */

 /**
 * Arrow object definition, for connections to other nodes within a DSL.
 * @typedef {Object} Arrow
 * @property {string} target - Target node ID of connection.
 * @property {string} color - Color of visual connection.
 * @property {string} style - Graphical representation type of link (source-to-target, target-to-source, both-ways). 
*/
//import console_ from '../../console/src/index'

export default class dsl_parser {

	constructor({ file, source, config={} }={}) {
		if (!file && !source) this.throwIfMissing('file/source');
		let console_ = require('@concepto/console');
		let def_config = {
			cancelled:true,
			debug:true
		};
		if (file) this.file = file;
		if (source) this.source = source;
		this.config = {...def_config,...config};
		this.help = new helper();
		this.debug = new console_({ silent:!this.config.debug });
		this.$ = null;
		this.x_memory_cache = {
			getNode: {}
		};
	}

	async hash(thing) {
		let resp = thing.toString();
		if (thing) {
			try {
				let cryptoAsync = require('@ronomon/crypto-async');
				let hmac = {};
				if (typeof thing==='object') {
					hmac = await cryptoAsync.hmac('sha256',Buffer.alloc(1024), Buffer.from(JSON.stringify(thing)));
				} else {
					hmac = await cryptoAsync.hmac('sha256',Buffer.alloc(1024), Buffer.from(thing));
				}
				resp = hmac.toString('hex');
			} catch(err) {
				const {sha1} = require('crypto-hash');
				if (typeof thing==='object') {
		        	resp = await sha1(JSON.stringify(thing),{ outputFormat:'hex' });
				} else {
		        	resp = await sha1(thing,{ outputFormat:'hex' });
				}
			}
		}
		/*
		let cryp = require('crypto').createHash;
		let resp = cryp('sha256').update(thing).digest('hex');*/
		/*
        const {sha1} = require('crypto-hash');
        let resp = await sha1(thing,{ outputFormat:'hex' });
    	*/

	   	return resp;
    }

	/**
	* Executes initial processing for parser
	*/
	async process() {
		if ((this.file && this.file!='') || (this.source && this.source!='')) {
			this.debug.setPrefix({ prefix:'dsl_parser', color:'yellow' });
			if (this.file) this.debug.title({ title:'DSL Parser for '+this.file, color:'green' });
			this.debug.time({ id:'process' });
			//if (this.config.debug) console.time('process');
			let cheerio = require('cheerio'), path = require('path');
			let fs = require('fs').promises;
			let fileExists = false, data='';
			if (this.file) data = await fs.readFile(this.file,'utf-8');
			if (this.source && this.source!='') data = this.source;
			// fix accents -> unicode to latin chars
			this.debug.outT({ message:'fixing accents' });
			//if (this.config.debug) console.log('fixing accents');
			data = this.help.fixAccents(data);
			// parse XML 
			this.$ = cheerio.load(data, { ignoreWhitespace: false, xmlMode:true, decodeEntities:false });
			// remove cancelled nodes if requested
			if (this.config.cancelled && this.config.cancelled==false) {
				this.debug.outT({ message:'removing cancelled nodes from tree' });
				//if (this.config.debug) console.log('removing cancelled nodes from tree');
				try {
					//this assumes there is at least one cancelled node; so using try/catch for not testing
					this.$('icon[BUILTIN*=button_cancel]').parent().remove();
				} catch(eeec) {
				}
			}
			this.debug.timeEnd({ id:'process' });
			//if (this.config.debug) console.timeEnd('process');
		}
	}

	/**
	* Gets a reference to the internal parser
	* @return 	{Object}
	*/
	getParser() {
		return this.$;
	}

	/**
	* Get all nodes that contain the given arguments (all optional)
	* @param 	{String}	[text]				- Finds all nodes that contain its text with this value
	* @param 	{String}	[attribute]			- Finds all nodes that contain an attribute with this name
	* @param 	{String}	[attribute_value]	- Finds all nodes that contain an attribute with this value
	* @param 	{String}	[icon]				- Finds all nodes that contain these icons
	* @param 	{Int}		[level] 			- Finds all nodes that are on this level
	* @param 	{String}	[link] 				- Finds all nodes that contains this link
	* @param 	{Boolean}	[recurse=true]		- include its children 
	* @param 	{Boolean}	[nodes_raw=false]	- if this is true, includes key nodes_raw (children nodes) in result with a cheerio reference instead of processing them.
	* @return 	{NodeDSL[]}
	*/
	async getNodes({ text,attribute,attribute_value,icon,level,link,recurse=true,nodes_raw=false, hash_content=false }={}) {
		let resp = [], nodes=null, me=this, fmatch='';
		if (nodes_raw==true) recurse=false;
		// match first param that is defined
		if (text) {
			let tmp = text.toString().replace(/ /g,'\\ ');
			nodes = this.$(`node[TEXT*=${tmp}]`);
			fmatch = 'text';
		} else if (attribute) {
			let tmp = attribute.replace(/ /g,'\\ ');
			nodes = this.$(`attribute[NAME*=${tmp}]`).parent('node');
			fmatch = 'attribute';
		} else if (attribute_value) {
			let tmp = attribute_value.replace(/ /g,'\\ ');
			nodes = this.$(`attribute[VALUE*=${tmp}]`).parent('node');
			fmatch = 'attribute_value';
		} else if (icon) {
			let tmp = icon.replace(/ /g,'\\ ');
			nodes = this.$(`icon[BUILTIN*=${tmp}]`).parent('node');
			fmatch = 'icon';
		} else if (level && !isNaN(level)) {
			nodes = this.$(`node`).filter(function(i,elem) {
				let padres = -1;
				try {
					padres = me.$(elem).parents('node').length+1;
				} catch(ee) {}
				return padres===level;
			});
			fmatch = 'level';
		} else if (link) {
			let tmp = link.replace(/ /g,'\\ ');
			nodes = this.$(`node[LINK*=${tmp}]`);
			fmatch = 'level';
		} else {
			nodes = this.$(`node`);
			fmatch = 'none';
		}
		// iterate nodes and build resp array
		if (nodes!=null) {
			await nodes.map(async function(i,elem) {
				let cur = me.$(elem);
				if (typeof cur.attr('ID') != 'undefined') {
					let tmp = await me.getNode({ id:cur.attr('ID'), recurse:recurse, nodes_raw:nodes_raw, hash_content:hash_content });
					// re-filter to see if all params defined match in this node (@TODO make more efficient doing before calling getNode; needs to be re-thinked)
					let all_met = true;
					// text
					if (all_met && text && fmatch!='text' && tmp.text.indexOf(text)==-1) all_met=false;
					// attribute
					if (all_met && attribute && fmatch!='attribute') {
						all_met = false;
						/*tmp.attributes.map(function(x){ 
							if(Object.keys(x)[0]==attribute) all_met=true; 
						});*/
						Object.keys(tmp.attributes).map(function(x){ 
							if(x==attribute) all_met=true; 
						});
					}
					// attribute_value
					if (all_met && attribute_value && fmatch!='attribute_value') {
						all_met = false;
						/*tmp.attribute_value.map(function(x){ 
							if(Object.keys(x)[1]==attribute_value) all_met=true; 
						});*/
						Object.keys(tmp.attributes).map(function(x){ 
							if(attr[x]==attribute_value) all_met=true; 
						});
					}
					// icon
					if (all_met && icon && fmatch!='icon') {
						all_met = false;
						tmp.icons.map(function(x) {
							if (x==icon) all_met=true;
						});
					}
					// level
					if (all_met && level && fmatch!='level') {
						if (isNaN(level)) {
							all_met = numberInCondition(tmp.level,level);
						} else {
							if (tmp.level!=level) all_met=false;
						}
					}
					//
					if (all_met==true) resp.push(tmp);
					/*if (recurse==true && all_met==true) {
						let tmp2 = await me.getNode({ id:cur.attr('ID'), recurse:recurse, nodes_raw:nodes_raw });
						resp.push(tmp2);
					} else if (all_met) {
						resp.push(tmp);
					}*/
				}
			});
		}
		//console.log('resp',resp);
		return resp;
	}

	/**
	 * Adds a node as an xml child of the given parent node ID
	 * @param 	{String}	parent_id 		- ID of parent node
	 * @param	{NodeDSL}	node			- NodeDSL object to add
	 */
	 async addNode({ parent_id=this.throwIfMissing('parent_id - addNode'), node=this.throwIfMissing('node - addNode') }={}) {
		//to do idea: secret icon nodes -> encrypted json with 'secrets' config node within _git.dsl version (cli arg --secret 'pass' y --un_git (crea ver no git con secrets desencriptado))
		//grab parentID
		let me = this;
		let parent = await this.$('node[ID='+parent_id+']').each(async function(i,elem) {
			let cur = me.$(elem);
			let txml = await me.nodeToXML({node});
			cur.append(txml);
		});
		return me.$.html();
	}

	/**
	 * Edits the given node ID data keys
	 * @param 	{String}	node_id 		- ID of node to edit
	 * @param	{NodeDSL}	data			- NodeDSL object properties to modify or method(existing_properties_of_node) that returns object data to modify
	 */
	 async editNode({ node_id=this.throwIfMissing('node_id - editNode'), data=this.throwIfMissing('data - editNode'), children=true }={}) {
		//grab nodetID
		let me = this;
		this.debug.outT({ message:`editNode: getting nodeID:${node_id}` });
		let key_node = await this.getNode({ id:node_id, recurse:children });
		//overwrite node data with given data, and get the new xml
		let ndata = key_node, new_xml = '';
		if (typeof data === 'function') {
			let tmp = await data(key_node);
			ndata = {...ndata,...tmp};
		} else {
			ndata = {...ndata,...data};
		}
		this.debug.outT({ message:`editNode: converting data to xml` });
		new_xml = await this.nodeToXML({ node:ndata }); 
		this.debug.outT({ message:`editNode: replacing xml` });
		let target = await this.$('node[ID='+node_id+']').toArray();
		if (target.length>0) {
			let target_node = this.$(target[0]);
			target_node.replaceWith(new_xml);
		}
		this.debug.outT({ message:`editNode: ready!` });
		return me.$.html();
	}

	/**
	 * Converts a NodeDSL into an XML of ConceptoDSL node child
	 * @param	{NodeDSL}	node			- NodeDSL origin object
	 */
	async nodeToXML({ node=this.throwIfMissing('node - nodeToXML') }={}) {
		let he = require('he');
		let toxml = function(o) {
			let { create } = require('xmlbuilder2');
			return create(o).end({ prettyPrint:true });
		};
		let nodeToObj = function(node) {
			let getRandomInt = function(min, max) {
				return Math.floor(Math.random() * (max - min)) + min;
			}
			let base = { 		id:'ID_'+getRandomInt(10000000,90000000), level:-1,	text:'',	text_rich:'',	text_note:'', 	text_note_html:'',	image:'',
								cloud:
									{ used:false, bgcolor:'' },	
								arrows:[], 	nodes:[],
								font:
									{ face:'SansSerif', size:12, bold:false, italic:false },
								style:'',		color: '',	bgcolor: '',	link:'',	position:'',
								attributes: {},	icons: [],	
								date_modified: new Date(),	
								date_created: new Date(),
								valid: true
							};
			let node_obj = {...base,...node};
			//prepare node_obj
			let obj = {
				node: { 
					'@ID': node_obj.id
				}
			};
			if (node_obj.date_created) {
				if (typeof node_obj.date_created == 'string') {
					let tmpdate = new Date(node_obj.date_created);
					obj.node['@CREATED'] = tmpdate.getTime();
				} else {
					obj.node['@CREATED'] = node_obj.date_created.getTime();
				}
			}
			if (node_obj.date_modified) {
				if (typeof node_obj.date_modified == 'string') {
					let tmpdate = new Date(node_obj.date_modified);
					obj.node['@MODIFIED'] = tmpdate.getTime();
				} else {
					obj.node['@MODIFIED'] = node_obj.date_modified.getTime();
				}
			}
			if (node_obj.link!='') obj.node['@LINK'] = '#'+node_obj.link;
			if (node_obj.position!='') obj.node['@POSITION'] = node_obj.position;
			if (node_obj.color!='') obj.node['@COLOR'] = node_obj.color;
			if (node_obj.bgcolor!='') obj.node['@BACKGROUND_COLOR'] = node_obj.bgcolor;
			if (node_obj.style!='') obj.node['@STYLE'] = node_obj.style;
			if (node_obj.text!='') obj.node['@TEXT'] = node_obj.text;
			//<attribute_layout NAME_WIDTH="230" VALUE_WIDTH="301"/>
			//determine attributes auto-width
			let attr_max_namelen=0, attr_max_valuelen=0;
			for (let att in node_obj.attributes) {
				if (att.length>attr_max_namelen) attr_max_namelen=att.length;
				if (node_obj.attributes[att].length>attr_max_valuelen) attr_max_valuelen=node_obj.attributes[att].length;
			}
			if (attr_max_namelen>0 && attr_max_valuelen>0) {
				if (!obj.node['#']) obj.node['#'] = [];
				obj.node['#'].push({
					attribute_layout: {
						'@NAME_WIDTH': Math.round(attr_max_namelen*6.67),
						'@VALUE_WIDTH': Math.round(attr_max_valuelen*6.67)
					}
				});
			}
			//attributes
			for (let att in node_obj.attributes) {
				if (!obj.node['#']) obj.node['#'] = [];
				obj.node['#'].push({
					attribute: {
						'@NAME': att,
						'@VALUE': node_obj.attributes[att]
					}
				});
				if (att.length>attr_max_namelen) attr_max_namelen=att.length;
				if (node_obj.attributes[att].length>attr_max_valuelen) attr_max_valuelen=node_obj.attributes[att].length;
			}
			//icons
			for (let icon of node_obj.icons) {
				if (!obj.node['#']) obj.node['#'] = [];
				obj.node['#'].push({
					icon: {
						'@BUILTIN': icon
					}
				});
			}
			//fonts
			if (JSON.stringify(node_obj.font)!=JSON.stringify(base.font)) {
				if (!obj.node['#']) obj.node['#'] = [];
				let font_obj={
					font: {
						'@NAME': node_obj.font.face,
						'@SIZE': node_obj.font.size
					}
				};
				if (node_obj.font.bold && node_obj.font.bold==true) font_obj.font['@BOLD']=true;
				if (node_obj.font.italic && node_obj.font.italic==true) font_obj.font['@ITALIC']=true;
				obj.node['#'].push(font_obj);
			}
			// cloud definition
			if (node_obj.cloud.used==true) {
				if (!obj.node['#']) obj.node['#'] = [];
				obj.node['#'].push({
					cloud: {
						'@COLOR': node_obj.cloud.bgcolor
					}
				});
			}
			// image
			if (node_obj.image!='') {
				if (!obj.node['#']) obj.node['#'] = [];
				obj.node['#'].push({
					richcontent: {
						'@TYPE': 'NODE',
						'#': {  
							html: {
								head:{},
								body: {
									p: {
										img: {
											'@src':node_obj.image,
											'@width':100,
											'@height':100
										}
									}
								}
							}
						}
					}
				});
			}
			// notes on node
			if (node_obj.text_note!='' || node_obj.text_note_html!='') {
				if (!obj.node['#']) obj.node['#'] = [];
				let content = '';
				if (node_obj.text_note) content = node_obj.text_note;
				if (node_obj.text_note_html) content = node_obj.text_note_html;
				let t = {
					richcontent: {
						'@TYPE': 'NOTE',
						'#': {  
							html: {
								head:{},
								body: {}
							}
						}
					}
				};
				if (node_obj.text_note_html) {
					t.richcontent['#'].html.body = node_obj.text_note_html;
				} else {
					t.richcontent['#'].html.body = { p:node_obj.text_note };
				}
				obj.node['#'].push(t);
			}
			// set node arrows
			if (node_obj.arrows.length>0) {
				if (!obj.node['#']) obj.node['#'] = [];
				for (let arr of node_obj.arrows) {
					let arrow = {
						arrowlink: {
							'@ID': 'Arrow_'+node_obj.id,
							'@DESTINATION': arr.target,
							'@STARTINCLINATION': '0;0;',
							'@ENDINCLINATION': '0;0;'
						}
					};
					if (arr.color!='') arrow.arrowlink['@COLOR'] = arr.color;
					if (arr.type=='source-to-target') {
						arrow.arrowlink['@STARTARROW'] = 'None';
						arrow.arrowlink['@ENDARROW'] = 'Default';
					} else if (arr.type=='target-to-source') {
						arrow.arrowlink['@STARTARROW'] = 'Default';
						arrow.arrowlink['@ENDARROW'] = 'None';
					} else {
						arrow.arrowlink['@STARTARROW'] = 'Default';
						arrow.arrowlink['@ENDARROW'] = 'Default';
					}
					obj.node['#'].push(arrow);
				}
			}
			//process children nodes
			if (node_obj.nodes.length>0) {
				for (let xc of node_obj.nodes) {
					if (!obj.node['#']) obj.node['#'] = [];
					obj.node['#'].push(nodeToObj(xc));
				}
			}
			//
			return obj;
		};
		//
		return toxml(nodeToObj(node)).replace(`<?xml version="1.0"?>`,``);
	}

	/**
	* Get node data for the given id
	* @param 	{String}	id				- ID of node to request
	* @param 	{Boolean}	[recurse=true] 	- include its children
	* @param 	{Boolean}	[dates=true]	- include parsing creation/modification dates
	* @param 	{Boolean}	[$=false]		- include cheerio reference
	* @param 	{Boolean}	[nodes_raw=false]	- if recurse is false and this is true, includes key nodes_raw (children nodes) in result with a cheerio reference instead of processing them.
	* @return 	{NodeDSL[]}
	*/
	async getNode({ id=this.throwIfMissing('id - getNode'), recurse=true, justlevel, dates=true, $=false, nodes_raw=false, hash_content=false }={}) {
		if (this.$===null) throw new Error('call process() first!');
		if (id in this.x_memory_cache.getNode && this.x_memory_cache.getNode[id].valid && this.x_memory_cache.getNode[id].valid==true && nodes_raw==false && $==false) {
			return this.x_memory_cache.getNode[id];
		} else {
			let me = this;
			let resp = { 	level:-1,	text:'',	text_rich:'',	text_note:'', 	text_note_html:'',	image:'',
							cloud:
								{ used:false, bgcolor:'' },	
							arrows:[], 	nodes:[],
							font:
								{ face:'SansSerif', size:12, bold:false, italic:false },
							style:'',		color: '',	bgcolor: '',	link:'',	position:'',
							attributes: {},	icons: [],	
							date_modified: new Date(),	
							date_created: new Date(),
							valid: true
						};
			let he = require('he');
			let nodes = await me.$('node[ID='+id+']').each(async function(i,elem) {
				let cur = me.$(elem), pa_ac = -1;
				resp.id = cur.attr('ID');
				resp.level = cur.parents('node').length+1;
				// limit level if defined
				if (justlevel && resp.level!=justlevel) {
					resp.valid=false;
					return false;
				}
				// add ref to $
				if ($) resp.$ = cur;
				// add hash of content
				//me.debug.outT({ message:'creating hash for node '+resp.id });
				if (hash_content && hash_content==true) {
					let content_ = cur.html();
					//me.debug.outT({ message:'content:'+content_ });
					resp.hash_content = await me.hash(content_);
					//me.debug.outT({ message:'hash created:'+resp.hash_content });
				}
				//
				if (typeof cur.attr('LINK') != 'undefined') resp.link = cur.attr('LINK').split('#').join('');
				if (typeof cur.attr('POSITION') != 'undefined') resp.position = cur.attr('POSITION');
				if (typeof cur.attr('COLOR') != 'undefined') resp.color = cur.attr('COLOR');
				if (typeof cur.attr('BACKGROUND_COLOR') != 'undefined') resp.bgcolor = cur.attr('BACKGROUND_COLOR');
				if (typeof cur.attr('STYLE') != 'undefined') resp.style = cur.attr('STYLE');
				if (typeof cur.attr('TEXT') != 'undefined') resp.text = cur.attr('TEXT');
				resp.text = he.decode(resp.text);
				/*resp.text = resp.text 	.replaceAll('&lt;','<')
										.replaceAll('&gt;','>')
										.replaceAll('&amp;','&')
										.replaceAll('&apos;',`'`)
										.replaceAll('&quot;',`"`);*/
				// dates parsing
				if (dates) {
					if (typeof cur.attr('CREATED') != 'undefined') {
						resp.date_created = new Date(parseFloat(cur.attr('CREATED')));		
					}
					if (typeof cur.attr('MODIFIED') != 'undefined') {
						resp.date_modified = new Date(parseFloat(cur.attr('MODIFIED')));	
					}
				}
				// attributes
				cur.find('node[ID='+resp.id+'] > attribute').map(function(a,a_elem) {
					let tmp_fila = {}, _fila = me.$(a_elem);
					//tmp_fila[_fila.attr('NAME')] = _fila.attr('VALUE');
					//resp.attributes.push(tmp_fila);
					resp.attributes[_fila.attr('NAME')] = he.decode(_fila.attr('VALUE'));
				});
				// icons
				cur.find('node[ID='+resp.id+'] > icon').map(function(a,a_elem) {
					resp.icons.push(me.$(a_elem).attr('BUILTIN'));
				});
				// fonts definition
				cur.find('node[ID='+resp.id+'] > font').map(function(a,a_elem) {
					let _fila = me.$(a_elem);
					resp.font.face = _fila.attr('NAME');
					resp.font.size = _fila.attr('SIZE');
					if (typeof _fila.attr('BOLD') != 'undefined') {
						resp.font.bold = (_fila.attr('BOLD')=='true')?true:false;
					}
					if (typeof _fila.attr('ITALIC') != 'undefined') {
						resp.font.italic = (_fila.attr('ITALIC')=='true')?true:false;
					}
				});
				// cloud definition
				cur.find('node[ID='+resp.id+'] > cloud').map(function(a,a_elem) {
					let _fila = me.$(a_elem);
					resp.cloud.used = true;
					if (typeof _fila.attr('COLOR') != 'undefined') {
						resp.cloud.bgcolor = _fila.attr('COLOR');
					}
				});
				// get image if any on node
				cur.find('node[ID='+resp.id+'] > richcontent[TYPE=NODE] body').map(function(a,a_elem) {
					resp.text_rich = me.$(a_elem).html();
					me.$(a_elem).find('img[src]').map(function(i,i_elem) {
						resp.image = me.$(i_elem).attr('src');
					});
				});
				// get notes on node if any
				cur.find('node[ID='+resp.id+'] > richcontent[TYPE=NOTE] body').map(function(a,a_elem) {
					resp.text_note = me.$(a_elem).text();
					resp.text_note_html = me.$(a_elem).html();
				});
				// get defined arrows on node if any
				cur.find('node[ID='+resp.id+'] > arrowlink').map(function(a,a_elem) {
					let _fila = me.$(a_elem), _tmp_f={ target:'', color:'', style:'' }, _tmpa={};
					_tmp_f.target = _fila.attr('DESTINATION');
					if (typeof _fila.attr('COLOR') != 'undefined') {
						_tmp_f.color = _fila.attr('COLOR');
					}
					_tmpa.type = _fila.attr('STARTARROW') + '-' + _fila.attr('ENDARROW');
					if (_tmpa.type.indexOf('None-Default')!=-1) {
						_tmp_f.style = 'source-to-target';
					} else if (_tmpa.type.indexOf('Default-None')!=-1) {
						_tmp_f.style = 'target-to-source';
					} else {
						_tmp_f.style = 'both-ways';
					}
					resp.arrows.push(_tmp_f);
				});
				// get children nodes .. (using myself for each child)
				if (recurse==true) {
					//console.log('getNode recurse:true, getting subnodes of nodeID:'+id);
					await cur.find('node').map(async function(a,a_elem) {
						let _nodo = me.$(a_elem);
						let _id = _nodo.attr('ID');
						if (!_id) {
							// 7-jun-21 hack: if the node doesn't have an ID attr, invent one.
							let getRandomInt = function(min, max) {
								return Math.floor(Math.random() * (max - min)) + min;
							}
							_id = 'ID_'+getRandomInt(10000000,90000000);
							_nodo.attr('ID',_id);
						}
						try {
							let hijo = await me.getNode({ id:_id, recurse:recurse, justlevel:resp.level+1, hash_content:hash_content });
							if (hijo.valid) {
								//delete hijo.valid;
								resp.nodes.push(hijo);
							}
						} catch(err00) {
							console.log('ERROR getting child node info: '+_nodo.toString(),err00);
						}
					}.bind(this));
				} else if (nodes_raw==true) {
					resp.nodes_raw = cur.find('node');
					/* */
					resp.getNodes = async function() {
						// this.me and this.cur
						let resp=[];
						//console.log('getNodes() called for node ID:'+this.dad.id);
						await this.cur.find('node').map(async function(a,a_elem) {
							let _nodo = this.me.$(a_elem);
							let _id = _nodo.attr('ID');
							if (!_id) {
								// 28-may-21 hack: if the node doesn't have an ID attr, invent one.
								let getRandomInt = function(min, max) {
									return Math.floor(Math.random() * (max - min)) + min;
								}
								_id = 'ID_'+getRandomInt(10000000,90000000);
								_nodo.attr('ID',_id);
							}
							try {
								let hijo = await this.me.getNode({ id:_id, justlevel:this.level+1, recurse:false, nodes_raw:true, hash_content:hash_content });
								if (hijo.valid) { //10may21 @check this, maybe needs && hijo.valid==true
									//delete hijo.valid;
									resp.push(hijo);
								}
							} catch(errson) {
								console.log('ERROR getting child node info: '+_nodo.toString(),errson);
							}
						}.bind(this));
						return resp;
					}.bind({me,cur,level:resp.level,dad:resp});
				}
				// break loop
				return false;
			});
			if (resp.valid && resp.valid==true && nodes_raw==false && $==false) {
				// remove 'valid' key if justLevel is not defined
				//if (!justlevel) delete resp.valid; //this doesnt seem right (27-4-21)
				this.x_memory_cache.getNode[id] = resp;
			}			
			// reply
			return resp;
		}
	}

	/**
	* Returns the parent node of the given node id
	* @param 	{String}	id				- ID of node to request
	* @param 	{Boolean}	[recurse=false] - include its children
	* @return 	{NodeDSL} 
	*/
	async getParentNode({ id=this.throwIfMissing('id - ParentNode'), recurse=false }={}) {
		if (this.$===null) throw new Error('call process() first!');
		let padre = this.$(`node[ID=${id}]`).parent('node');
		let resp = {}, me = this;
		if (typeof padre.attr('ID') != 'undefined') {
			resp = await me.getNode({ id:padre.attr('ID'), recurse:recurse });
		}
		return resp;
	}

	/**
	* Returns the parent nodes ids of the given node id
	* @param 	{String}		id 				- node id to query
	* @param 	{Boolean}		[array=false]	- get results as array, or as a string
	* @return 	{String|Array}
	*/
	async getParentNodesIDs({ id=this.throwIfMissing('id - ParentNodesIDs'), array=false }={}) {
		let padres = this.$(`node[ID=${id}]`).parents('node');
		let resp = [], me=this;
		padres.map(function(i,elem) {
			let item = me.$(elem);
			if (typeof item.attr('ID') != 'undefined') {
				resp.push(item.attr('ID'));
			}
		});
		// delete the last item (central node) and return
		resp.pop();
		if (array) {
			return resp;
		} else {
			return resp.join(',');
		}
	}

	/**
	* Returns the children nodes ids of the given node id
	* @param 	{String}	id 				- node id to query
	* @param 	{Boolean}	[array=false]	- get results as array, or as a string
	* @return 	{String|Array}
	*/
	async getChildrenNodesIDs({ id=this.throwIfMissing('id - ChildrenNodesIDs'), array=false }={}) {
		let hijos = this.$(`node[ID=${id}]`).find('node');
		let resp = [], me=this;
		hijos.map(function(i,elem) {
			let item = me.$(elem);
			if (typeof item.attr('ID') != 'undefined') {
				resp.push(item.attr('ID'));
			}
		});
		if (array) {
			return resp;
		} else {
			return resp.join(',');
		}
	}

	/**
	* Returns the brother nodes ids of the given node id
	* @param 	{String}	id 				- node id to query
	* @param 	{Boolean}	[before=true] 	- consider brothers before the queried node
	* @param 	{Boolean}	[after=true] 	- consider brothers after the queried node
	* @param 	{Boolean}	[array=false]	- get results as array of objects, or as a string
	* @return 	{String}
	*/
	async getBrotherNodesIDs({ id=this.throwIfMissing('id - BrotherNodesIDs'), before=true, after=true, array=false }={}) {
		let me_data = await this.getNode({ id:id, recurse:false, $:true });
		let resp = [];
		if (before) {
			let prev = me_data.$.prev('node'); 
			while (typeof prev.get(0) != 'undefined') {
				if (array==false) {
					resp.push(prev.get(0).attribs.ID);
				} else {
					resp.push(prev.get(0).attribs);
				}
				prev = prev.prev('node');
			}
		}
		if (after) {
			let next = me_data.$.next('node'); 
			while (typeof next.get(0) != 'undefined') {
				if (array==false) {
					resp.push(next.get(0).attribs.ID);
				} else {
					resp.push(next.get(0).attribs);
				}
				next = next.next('node');
			}	
		}
		// return
		if (array) {
			return resp;
		} else {
			return resp.join(',');
		}
	}

	/**
	* Returns a modified version of the current loaded DSL, ready to be push to a version control (like github)
	* @param 	{Boolean}	[remove] 		- Remove modified dates? (default:true)
	* @param 	{Function}	[extrastep] 	- Optional method to return make additional cleansing and return the xml
	* @return 	{String} 					  Modified DSL source ready to be saved and pushed to a version control
	*/
	async createGitVersion(remove=true,extrastep) {
		// 1) get copy of current DSL content into memory (for restoring after returning)
		let copy = this.$.html(), me = this;
		// 2) get all nodes
		let nodes = this.$(`node`);
		// 
		nodes.each(function(i,elem) {
			// 3) replace all attributes CREATED with fixed value
			me.$(elem).attr("CREATED", "1552681669876");
			if (remove==true) {
				// 4) replace all attributes MODIFIED with fixed value
				me.$(elem).attr("MODIFIED", "1552681669876");
			}
			// 5) erase all attributes VSHIFT and HGAP
			me.$(elem).removeAttr("VSHIFT");
			// 6) erase all attributes HGAP
			me.$(elem).removeAttr("HGAP");
		});
		// 7) transform all latin accents into original-unicodes (fixAccents(text,recover=true) (helper class))
		let resp = this.$.html();
		// 8) extrastep
		if (extrastep && typeof extrastep == 'function') {
			resp = extrastep(this.$);
		}
		resp = this.help.fixAccents(resp,true);
		// recover original tags to current parser $.
		this.$ = this.$.load(copy, { ignoreWhitespace: false, xmlMode:true, decodeEntities:false });
		// return
		return resp;
	}

	// ********************
	// private methods
	// ********************

	throwIfMissing(name) {
        throw new Error('Missing '+name+' parameter!');
    }

    /**
	* Finds variables within given text
	* @param 	{String}	text 				- String from where to parse variables
	* @param 	{String}	[symbol=**]			- Wrapper symbol used as variable openning definition.
	* @param 	{String}	[symbol_closing=**] - Wrapper symbol used as variable closing definition.
	* @param 	{Boolean}	[array=false]		- get results as array, or as a string
	* @return 	{String}
	*/
    findVariables({ text=this.throwIfMissing('text'),symbol='**',symbol_closing='**', array=false }={}) {
		const escapseRegExp = function(str) {
		    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		}		
		let extractorPattern = new RegExp(escapseRegExp(symbol) + '(.*?)' + escapseRegExp(symbol_closing), 'g');
		let resp=[];
		let nadamas = false;
		while(!nadamas) {
			let test = new RegExp(extractorPattern,'gim');
			let utiles = text.match(test);
			for (let i in utiles) {
				resp.push(utiles[i].split(symbol).join('').split(symbol_closing).join(''));
			}
			nadamas = true;
		}
		return (array)?resp:resp.join(',');
	}

	/**
	* Finds and transform variables wrapping/handlebars symbols given a 'from' symbol object and a 'to' symbol object within the given text
	* @param 	{String}	text 				- String from where to parse variables
	* @param 	{Object}	from				- Object to identify source variables symbols (keys: open and close)
	* @param 	{Object}	to 					- Object to identify target variables symbols (keys: open and close)
	* @return 	{String}
	*/
    replaceVarsSymbol({ text=this.throwIfMissing('text'),from={ open:'**', close:'**'},to={ open:'**', close:'**'} }={}) {
    	let source = this.findVariables({ text, symbol:from.open, symbol_closing:from.close, array:true });
    	let resp = text, tmp={};
    	for (let item of source) {
    		tmp.from = from.open+item+from.close;
    		tmp.to = to.open+item+to.close;
    		resp = resp.replace(tmp.from,tmp.to);
    	}
    	return resp;
	}

	/** 
	* Finds all differences 'from' given dsl 'to' given dsl (for CLI arg --diff-from file.dsl)
	* and returns an object with 'deleted', 'added', and 'modified' IDs keys
	* @param 	{String}	from 				- From source DSL content (before code)
	* @param 	{String}	to 					- To source DSL content (after code, to compare)
	*/
	async getDifferences(from,to) {
		this.debug.outT({ message:'getDifferences: init' });
		let changes = async function(source,target) {
			this.debug.outT({ message:'getDifferences: changes init' });
			let prettydiff = require('prettydiff');
			let extract = require('extractjs')();
			let report={ deleted:{}, added:{}, modified:{} };
			//console.log(prettydiff);
			let opts = {
				source: source,
				diff: target
			};
			prettydiff.options.source = opts.source;
			prettydiff.options.diff = opts.diff;
			prettydiff.options.diff_format = 'json';
			this.debug.outT({ message:`getDifferences: calling prettydiff`});
			let tdiff = prettydiff();
			this.debug.outT({ message:`getDifferences: parsing diff as resp`});
			let resp = JSON.parse(tdiff).diff;
			this.debug.outT({ message:`getDifferences: parsing diff as resp_bak`});
			let resp_bak = JSON.parse(tdiff).diff;
			// build report
			this.debug.outT({ message:`getDifferences: building report` });
			let counter_ = 0;
			for (let line in resp) {
				if ((counter_%1000)==0) this.debug.outT({ message:`getDifferences: reading 1000 lines from line ${line} (of ${resp.length})` });
				counter_ += 1;
				let content = resp[line];
				let operator = content.shift();
				if (true) { //operator!='=' //true //operator!='r'
					//console.log('operador:'+operator);
					let related_id = -1;
					let test = extract(`id="ID_{id}"`,content[0]);
					if (!test.id) test = extract(`ID="ID_{id}"`,content[0]);
					if (test.id) {
						related_id = `ID_${test.id}`;
						if (operator=='+') {
							report.added[related_id]=resp[line]; //line
						} else if (operator=='r') {
							//node modified
							report.modified[related_id]=resp[line];
						}
					} else {
						//search parents for id if line doesn't contain it
						//console.log('ID no encontrado en linea analizada '+content[0]+',revisando previos con operator tipo =');
						for (let i = line; i>=0; i--) {
							let ope = resp_bak[i][0];
							if (true) { //'=,+,r,-'.split(',').includes(ope)
								let to_check = resp_bak[i];
								if (typeof to_check == 'string') {
									to_check = to_check.trim();
									//console.log('(string) getting code from '+to_check);
								} else if (Array.isArray(to_check)) {
									//console.log('to_check.length = '+to_check.length);
									if (to_check.length==3) {
										//when ope is r=replace
										to_check = to_check[2].trim();
									} else {
										to_check = to_check[1].trim();
									}
								}
								if (to_check!='' && to_check.includes('ID_')==true) {                        
									let test = extract(`id="ID_{id}"`,to_check);
									if (!test.id) test = extract(`ID="ID_{id}"`,to_check);
									//console.log('checking for ID',{to_check,test});
									if (test.id) {
										related_id = `ID_${test.id}`;
										if (operator=='+') {
											report.added[related_id]=resp[line];
										} else if (operator=='-') {
											report.deleted[related_id]=resp[line];
										} else if (operator=='r') {
											report.modified[related_id]=resp[line]; //line
										}
										break;
									}
								}
							}
						}
					} 
				}
			}
			this.debug.outT({ message:`getDifferences: applying post-filters` });
			//filter; remove IDs from modified that also appear on added
			for (let x in report.added) {
				//21jun21
				if (opts.diff.includes(x)==true) {
					//if new file include the given ID and the old file, they it was modified (ex. an html note tag)
					if (report.added[x].length==2) report.modified[x]=report.added[x];
					delete report.added[x];
				} else {
					delete report.modified[x];
				}
			}
			//filter2: remove IDs from added if they also appear on deleted
			for (let x in report.deleted) {
				if (opts.source.includes(x)==false && opts.diff.includes(x)==true) {
					//24jun the id is on the old file and not on the new.. (seems a real deleted node)
					//report.added[x];
					//delete report.deleted[x];
				} else {
					if (x in report.added) {
						// if key is in added as well as deleted, then its a modified node
						delete report.added[x];
						report.modified[x]=report.deleted[x];
						delete report.deleted[x];
					}
				}
			}
			for (let x in report.modified) {
				if (opts.diff.includes(x)==false && opts.source.includes(x)==true) {
					//filter3: remove IDs from modified that dont exist in 'to' source, to 'deleted'
					report.deleted[x]=report.modified[x];
					delete report.modified[x];
				} else if (opts.source.includes(x)==false) {
					//filter3: remove IDs from modified that dont exist in 'source' source, to 'added'
					report.added[x]=report.modified[x];
					delete report.modified[x];
				} else if (x in report.deleted) {
					delete report.deleted[x];
				}
				//only keep modified values that are of same node type
				if (report.modified[x] && report.modified[x].length==2) {
					this.debug.outT({ message:`getDifferences: testing modified false positives` });
					let from = extract(`&lt;{tag} `,report.modified[x][0]);
					let after = extract(`&lt;{tag} `,report.modified[x][1]);
					//let after = extract(`&lt;/{tag}&`,report.modified[x][1]);
					//if (!after.tag) after = extract(`&lt;/{tag} `,report.modified[x][1]);
					if (from.tag!=after.tag) {
						this.debug.outT({ message:`getDifferences: removing: from '${from.tag}' to '${after.tag}'` });
						delete report.modified[x];
					}
				} else {
					this.debug.outT({ message:`getDifferences: cleaning modified false positive` });
					delete report.modified[x];
				}
			}
			this.debug.outT({ message:`getDifferences: finished processing` });
			return report;
		}.bind(this);
		let resp = await changes(from,to);
		return resp;
	}

}

//private methods
//returns true if num meets the conditions listed on test (false otherwise)
function numberInCondition(num,command_test) {	
	// num is always 'number' type
	let resp=true;
	if (command_test.toString()===num.toString()) {

	} else if (typeof command_test === 'number') {
		// cases test: 2,5,9,1 (exact matches)
		if (num==command_test) {
			resp=true;
		} else if (num!=command_test) {
			resp=false;
		}

	} else if (typeof command_test === 'string') {
		if (command_test.indexOf(',')==-1 && command_test.charAt(0)=='<') {
			// one condition: <2 or <7
			if (num>=parseInt(command_test.replace('<',''))) {
				resp=false;
			}
		} else if (command_test.indexOf(',')==-1 && command_test.charAt(0)=='>') {
			// one condition: >2 or >7
			if (num<=parseInt(command_test.replace('>',''))) {
				resp=false;
			}
		} else if (command_test.indexOf(',')==-1 && command_test!=num.toString()) {
			resp=false;

		} else {
			// cases test:['2','>2','2,3,5']
			let test2 = command_test.split(',');
			if (command_test.indexOf('<')==-1 && command_test.indexOf('>')==-1 && test2.includes(num)) {
				// exact match;
				resp=true;
			} else if (command_test.indexOf('<')!=-1 || command_test.indexOf('>')!=-1) {
				// test may be >2,<5,>7
				// 'and/all' (>2,<7)
				for (let i of test2) {
					if (i.charAt(0)=='>') {
						if (num<=parseInt(i.replace('>',''))) {
							resp=false;
							break;
						}
					} else if (i.charAt(0)=='<') {
						if (num>=parseInt(i.replace('<',''))) {
							resp=false;
							break;
						}
					}
				}
			}
		}
	} else {
		resp=false;
	}
	return resp;
}

String.prototype.replaceAll = function(strReplace, strWith) {
    // See http://stackoverflow.com/a/3561711/556609
    var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var reg = new RegExp(esc, 'ig');
    return this.replace(reg, strWith);
};

