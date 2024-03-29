<p align="center">
  <a href="http://www.puntorigen.com/" target="blank"><img src="https://user-images.githubusercontent.com/57605485/144762579-7114f229-a01a-4afd-9a18-62ec3dbf3478.png" width="320" alt="Concepto DSL Logo" /></a>
</p>
<p align="center">A progressive <a href="http://nodejs.org" target="blank">Node.js</a> framework for visually building efficient and scalable nodejs based applications.</p>
<p align="center">
    <a href="https://www.npmjs.com/~concepto"><img src="https://img.shields.io/npm/v/@concepto/dsl_parser.svg" alt="NPM Version" /></a>
    <a href="https://www.npmjs.com/~concepto"><img src="https://img.shields.io/npm/l/@concepto/dsl_parser.svg" alt="Package License" /></a>
    <a href="https://www.npmjs.com/~concepto"><img src="https://img.shields.io/npm/dm/@concepto/dsl_parser.svg" alt="NPM Downloads" /></a>
    <a href="https://www.npmjs.com/~concepto" target="_blank"><img src="https://img.shields.io/tokei/lines/github/puntorigen4u/dsl_parser"></a>
    <a href="https://twitter.com/punt0rigen" target="_blank"><img src="https://img.shields.io/twitter/follow/punt0rigen.svg?style=social&label=Follow"></a>
</p>

## Description
ES6 Class for creating and parsing <a href="https://www.npmjs.com/package/@concepto/cli">Concepto DSL</a> files.<br/>
Note you need to pass all arguments as an <i>object with keys</i>.

# API Reference
dsl_parser: A class for parsing Concepto DSL files, and compile them with the OPEN Framework.


* [dsl_parser](#module_dsl_parser)
    * _instance_
        * [.process()](#module_dsl_parser+process)
        * [.getParser()](#module_dsl_parser+getParser) ⇒ <code>Object</code>
        * [.getNodes([text], [attribute], [attribute_value], [icon], [level], [link], [recurse], [nodes_raw])](#module_dsl_parser+getNodes) ⇒ <code>Array.&lt;NodeDSL&gt;</code>
        * [.addNode(parent_id, node)](#module_dsl_parser+addNode)
        * [.editNode(node_id, data)](#module_dsl_parser+editNode)
        * [.nodeToXML(node)](#module_dsl_parser+nodeToXML)
        * [.getNode(id, [recurse], [dates], [$], [nodes_raw])](#module_dsl_parser+getNode) ⇒ <code>Array.&lt;NodeDSL&gt;</code>
        * [.getParentNode(id, [recurse])](#module_dsl_parser+getParentNode) ⇒ <code>NodeDSL</code>
        * [.getParentNodesIDs(id, [array])](#module_dsl_parser+getParentNodesIDs) ⇒ <code>String</code> \| <code>Array</code>
        * [.getChildrenNodesIDs(id, [array])](#module_dsl_parser+getChildrenNodesIDs) ⇒ <code>String</code> \| <code>Array</code>
        * [.getBrotherNodesIDs(id, [before], [after], [array])](#module_dsl_parser+getBrotherNodesIDs) ⇒ <code>String</code>
        * [.createGitVersion([remove], [extrastep])](#module_dsl_parser+createGitVersion) ⇒ <code>String</code>
        * [.findVariables(text, [symbol], [symbol_closing], [array])](#module_dsl_parser+findVariables) ⇒ <code>String</code>
        * [.replaceVarsSymbol(text, from, to)](#module_dsl_parser+replaceVarsSymbol) ⇒ <code>String</code>
        * [.getDifferences(from, to)](#module_dsl_parser+getDifferences)
    * _inner_
        * [~NodeDSL](#module_dsl_parser..NodeDSL) : <code>Object</code>
        * [~Arrow](#module_dsl_parser..Arrow) : <code>Object</code>

<a name="module_dsl_parser+process"></a>

### dsl_parser.process()
Executes initial processing for parser

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  
<a name="module_dsl_parser+getParser"></a>

### dsl_parser.getParser() ⇒ <code>Object</code>
Gets a reference to the internal parser

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  
<a name="module_dsl_parser+getNodes"></a>

### dsl_parser.getNodes([text], [attribute], [attribute_value], [icon], [level], [link], [recurse], [nodes_raw]) ⇒ <code>Array.&lt;NodeDSL&gt;</code>
Get all nodes that contain the given arguments (all optional)

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [text] | <code>String</code> |  | Finds all nodes that contain its text with this value |
| [attribute] | <code>String</code> |  | Finds all nodes that contain an attribute with this name |
| [attribute_value] | <code>String</code> |  | Finds all nodes that contain an attribute with this value |
| [icon] | <code>String</code> |  | Finds all nodes that contain these icons |
| [level] | <code>Int</code> |  | Finds all nodes that are on this level |
| [link] | <code>String</code> |  | Finds all nodes that contains this link |
| [recurse] | <code>Boolean</code> | <code>true</code> | include its children |
| [nodes_raw] | <code>Boolean</code> | <code>false</code> | if this is true, includes key nodes_raw (children nodes) in result with a cheerio reference instead of processing them. |

<a name="module_dsl_parser+addNode"></a>

### dsl_parser.addNode(parent_id, node)
Adds a node as an xml child of the given parent node ID

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Description |
| --- | --- | --- |
| parent_id | <code>String</code> | ID of parent node |
| node | <code>NodeDSL</code> | NodeDSL object to add |

<a name="module_dsl_parser+editNode"></a>

### dsl_parser.editNode(node_id, data)
Edits the given node ID data keys

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Description |
| --- | --- | --- |
| node_id | <code>String</code> | ID of node to edit |
| data | <code>NodeDSL</code> | NodeDSL object properties to modify or method(existing_properties_of_node) that returns object data to modify |

<a name="module_dsl_parser+nodeToXML"></a>

### dsl_parser.nodeToXML(node)
Converts a NodeDSL into an XML of ConceptoDSL node child

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Description |
| --- | --- | --- |
| node | <code>NodeDSL</code> | NodeDSL origin object |

<a name="module_dsl_parser+getNode"></a>

### dsl_parser.getNode(id, [recurse], [dates], [$], [nodes_raw]) ⇒ <code>Array.&lt;NodeDSL&gt;</code>
Get node data for the given id

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | <code>String</code> |  | ID of node to request |
| [recurse] | <code>Boolean</code> | <code>true</code> | include its children |
| [dates] | <code>Boolean</code> | <code>true</code> | include parsing creation/modification dates |
| [$] | <code>Boolean</code> | <code>false</code> | include cheerio reference |
| [nodes_raw] | <code>Boolean</code> | <code>false</code> | if recurse is false and this is true, includes key nodes_raw (children nodes) in result with a cheerio reference instead of processing them. |

<a name="module_dsl_parser+getParentNode"></a>

### dsl_parser.getParentNode(id, [recurse]) ⇒ <code>NodeDSL</code>
Returns the parent node of the given node id

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | <code>String</code> |  | ID of node to request |
| [recurse] | <code>Boolean</code> | <code>false</code> | include its children |

<a name="module_dsl_parser+getParentNodesIDs"></a>

### dsl_parser.getParentNodesIDs(id, [array]) ⇒ <code>String</code> \| <code>Array</code>
Returns the parent nodes ids of the given node id

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | <code>String</code> |  | node id to query |
| [array] | <code>Boolean</code> | <code>false</code> | get results as array, or as a string |

<a name="module_dsl_parser+getChildrenNodesIDs"></a>

### dsl_parser.getChildrenNodesIDs(id, [array]) ⇒ <code>String</code> \| <code>Array</code>
Returns the children nodes ids of the given node id

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | <code>String</code> |  | node id to query |
| [array] | <code>Boolean</code> | <code>false</code> | get results as array, or as a string |

<a name="module_dsl_parser+getBrotherNodesIDs"></a>

### dsl_parser.getBrotherNodesIDs(id, [before], [after], [array]) ⇒ <code>String</code>
Returns the brother nodes ids of the given node id

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | <code>String</code> |  | node id to query |
| [before] | <code>Boolean</code> | <code>true</code> | consider brothers before the queried node |
| [after] | <code>Boolean</code> | <code>true</code> | consider brothers after the queried node |
| [array] | <code>Boolean</code> | <code>false</code> | get results as array of objects, or as a string |

<a name="module_dsl_parser+createGitVersion"></a>

### dsl_parser.createGitVersion([remove], [extrastep]) ⇒ <code>String</code>
Returns a modified version of the current loaded DSL, ready to be push to a version control (like github)

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  
**Returns**: <code>String</code> - Modified DSL source ready to be saved and pushed to a version control  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [remove] | <code>Boolean</code> | <code>true</code> | Remove modified dates? (default:true) |
| [extrastep] | <code>function</code> |  | Optional method to return make additional cleansing and return the xml |

<a name="module_dsl_parser+findVariables"></a>

### dsl_parser.findVariables(text, [symbol], [symbol_closing], [array]) ⇒ <code>String</code>
Finds variables within given text

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| text | <code>String</code> |  | String from where to parse variables |
| [symbol] | <code>String</code> | <code>**</code> | Wrapper symbol used as variable openning definition. |
| [symbol_closing] | <code>String</code> | <code>**</code> | Wrapper symbol used as variable closing definition. |
| [array] | <code>Boolean</code> | <code>false</code> | get results as array, or as a string |

<a name="module_dsl_parser+replaceVarsSymbol"></a>

### dsl_parser.replaceVarsSymbol(text, from, to) ⇒ <code>String</code>
Finds and transform variables wrapping/handlebars symbols given a 'from' symbol object and a 'to' symbol object within the given text

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Description |
| --- | --- | --- |
| text | <code>String</code> | String from where to parse variables |
| from | <code>Object</code> | Object to identify source variables symbols (keys: open and close) |
| to | <code>Object</code> | Object to identify target variables symbols (keys: open and close) |

<a name="module_dsl_parser+getDifferences"></a>

### dsl_parser.getDifferences(from, to)
Finds all differences 'from' given dsl 'to' given dsl (for CLI arg --diff-from file.dsl)
and returns an object with 'deleted', 'added', and 'modified' IDs keys

**Kind**: instance method of [<code>dsl\_parser</code>](#module_dsl_parser)  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>String</code> | From source DSL content (before code) |
| to | <code>String</code> | To source DSL content (after code, to compare) |

<a name="module_dsl_parser..NodeDSL"></a>

### dsl_parser~NodeDSL : <code>Object</code>
A node object representation of a DSL node.

**Kind**: inner typedef of [<code>dsl\_parser</code>](#module_dsl_parser)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Node unique ID. |
| level | <code>number</code> | Indicates the depth level from the center of the dsl map. |
| text | <code>string</code> | Indicates the text defined in the node itself. |
| text_rich | <code>string</code> | Indicates the html defined in the node itself. |
| text_note | <code>string</code> | Indicates the text/html defined in the notes view of the node (if any). |
| image | <code>string</code> | Image link defined as an image within the node. |
| cloud | <code>Object</code> | Cloud information of the node. |
| cloud.bgcolor | <code>string</code> | Background color of cloud. |
| cloud.used | <code>boolean</code> | True if cloud is used, false otherwise. |
| arrows | <code>Array.&lt;Arrow&gt;</code> | Visual connections of this node with other nodes [#module_dsl_parser..Arrow](#module_dsl_parser..Arrow). |
| nodes | <code>Array.&lt;NodeDSL&gt;</code> | Children nodes of current node. |
| font | <code>Object</code> | Define font, size and styles of node texts. |
| font.face | <code>Object</code> | Font face type used on node. |
| font.size | <code>Object</code> | Font size used on node. |
| font.bold | <code>Object</code> | True if node text is in bold. |
| font.italic | <code>Object</code> | True if node text is in italics. |
| style | <code>string</code> | Style applied to the node. |
| color | <code>string</code> | Text color of node. |
| bgcolor | <code>string</code> | Background color of node. |
| link | <code>string</code> | Link defined on node. |
| position | <code>string</code> | Position in relation of central node (left,right). |
| attributes | <code>Object</code> | Object with each attribute (key is attribute name, value is attribute value). |
| icons | <code>Array.&lt;string&gt;</code> | Array with icon names used in the node. |
| date_modified | <code>date</code> | Date of node when it was last modified. |
| date_created | <code>date</code> | Date of node when it was created. |

<a name="module_dsl_parser..Arrow"></a>

### dsl_parser~Arrow : <code>Object</code>
Arrow object definition, for connections to other nodes within a DSL.

**Kind**: inner typedef of [<code>dsl\_parser</code>](#module_dsl_parser)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| target | <code>string</code> | Target node ID of connection. |
| color | <code>string</code> | Color of visual connection. |
| style | <code>string</code> | Graphical representation type of link (source-to-target, target-to-source, both-ways). |


* * *

&copy; 2020-2022 Pablo Schaffner &lt;pablo@puntorigen.com&gt;.