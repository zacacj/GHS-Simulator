$(function(){ // on dom ready
 
var cy = cytoscape({
  container: document.getElementById('cy'),
  
  style: cytoscape.stylesheet()
    .selector('node')
      .css({
        'content': 'data(id)',
        'background-color': 'data(bg)'
      })
    .selector('edge')
      .css({
        'target-arrow-shape': 'none',
        'width': 4,
        'line-color': '#ddd',
        'target-arrow-color': '#ddd'
      })
    .selector('.highlightedSource')
      .css({
        'background-color': '#61bffc',
        'line-color': '#61bffc',
        'source-arrow-shape': 'triangle',
        'source-arrow-color': '#61bffc',
        'transition-property': 'background-color, line-color, target-arrow-color',
        'transition-duration': '0.5s'
      })
      .selector('.highlightedTarget')
      .css({
        'background-color': '#61bffc',
        'line-color': '#61bffc',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#61bffc',
        'transition-property': 'background-color, line-color, target-arrow-color',
        'transition-duration': '0.5s'
      }),
  
  layout: {
    name: 'breadthfirst',
    directed: true,
    roots: '#a',
    padding: 10
  }
});
  
var collors = ['#ff0000','#ffff00','#00ff00','#0000ff','#000000','#00ffff','#808000','#ff0099','#808080']
var hasAnySelected = function(){
  var eles = cy.elements();

  for (var i = eles.length - 1; i >= 0; i--) {
    var ele = eles[i];
    if (ele.selected()) { return true};

  };
  return false;
}

var whoIsSelected = function(){
  var eles = cy.elements();

  for (var i = eles.length - 1; i >= 0; i--) {
    var ele = eles[i];
    if (ele.selected()) { return ele};

  };
  return false;
}


document.ondblclick = function(e) {

  if (!hasAnySelected()){
  cy.add({
    group: "nodes",
    data: { id : nodeIDCount.toString(), weight: 75, bg: collors.pop() },
    renderedPosition: { x: e.pageX, y: e.pageY }

    });
    ghsNodes.push(new GHSNode(nodeIDCount)) ;
   // cy.getElementById("nodeIDCount").style('background-color', '#00ff00');
    nodeIDCount++;
  }
};

var first = null;

document.onclick = function(e){
  if (event.ctrlKey) {
    if(!first){
      first = whoIsSelected()
    } else {
      var second = whoIsSelected();
      cy.add(
      { group: "edges", data: { id:first.id() + second.id() , weight: countEdgeWeight, source: first.id(), target: second.id()} });
      var nodep = getGHSNode(first.id());
      var nodeq = getGHSNode(second.id());
      nodep.addEdge(new GHSEdge(first.id(),second.id(),nodeq,countEdgeWeight ));
      nodeq.addEdge(new GHSEdge(first.id(),second.id(),nodep,countEdgeWeight ));
      countEdgeWeight++;
      first = null;
    }
} else {
}
}

document.oncontextmenu = function() {

  alert('right click!')

};

document.onkeypress = function(event) {
 // var char = getChar(event || window.event)
 // if (!char) return // special key
  if (event.keyCode == 115){
      initialize();
  }
}

var i = 0;
var initialize = function(){
  if (i <= ghsNodes.length - 1) {
    ghsNodes[i].initialize();
    i++;
    setTimeout(initialize(),0);
  };
}
 
// kick off first highlight
var nodeIDCount = 0;
var countEdgeWeight = 0;
var ghsNodes = [];

var getGHSNode = function (id){
  for (var i = ghsNodes.length - 1; i >= 0; i--) {
    if (ghsNodes[i].getId() == parseInt(id)){
      return ghsNodes[i];
    }
  };
}

function GHSNode(value){
  var id = value;
  var name = 0; // the name of the fragment. Initiallly each node has it own name.
  var level = 0; // The number of times fragments were united to create the fragmment which this node belongs.
  var state = 0; // the state of the node, which could be 0 - find, 1 - found.
  var counter = 0;
  var parentReport = 0;
  var bestWeight = 0;
  var parent;
  var testEdge;
  var bestEdge;
  var edges = [];
  var connections = [];

  this.getId = function() {
    return id;
  }

  this.getName = function () { 
    return name; 
  }; 

  this.initialize = function(){
   // alert("node: " + name + "; edge: " + this.findminimal().getWeight());
   var minEdge = this.findminimal();
   // cy.getElementById(minEdge.getP().toString() + minEdge.getQ().toString()).addClass('highlighted');
    if (name == minEdge.getP()){
      cy.getElementById(minEdge.getId()).addClass("highlightedTarget");
    } else {
      cy.getElementById(minEdge.getId()).addClass("highlightedSource");
    }

    state = 1;
    minEdge.setState(1);
    counter = 0;
    parentReport = 0;
    var node = this;
    setTimeout(function(){minEdge.getTarget().connect(0,node);console.log(node.getId()+ " send Connect" + minEdge.getTarget().getId())},0);


}
  this.findminimal = function(){


       var minEdge = edges[0];
    for (var i = edges.length - 1; i > 0; i--) {
      if (edges[i].weight < minEdge.weight){
        minEdge = edges[i];
      }
    };
    return minEdge;   

  }

  this.addEdge = function(ghsEdge){
    edges.push(ghsEdge);
  }

  this.connect = function(l,q){
      var node = this;
      var edge = this.findEdgeByTarget(q.getId());
      if (l < level){
        setTimeout(function(){q.initiate(name,level,state,node),console.log(node.getId()+ " send Initiate <" + q.getId())},0);
        edge.setState(1);
      } else if (edge.getState() == 1){
        setTimeout(function(){q.initiate(edge.getWeight(),level + 1,0,node),console.log(node.getId()+ " send Initiate ==" + q.getId())},0);
      } else {
        connections.push(new GHSConnection(q,l))
      }
  }

  this.initiate = function(fn,l,st,q){
    name = fn;
    level = l;
    state = st;
    parent = q;
    cy.getElementById(id).data('bg', cy.getElementById(q.getId()).data('bg'));
    bestEdge = null;
    bestWeight = 9999999;
    counter = 1;
    parentReport = 0;
    return Promise.resolve(1);

  }

  this.findEdgeByTarget = function(t){
    for (var i = edges.length - 1; i >= 0; i--) {
     //alert("t: " + t +"p: " + edges[i].getP() + " q: " + edges[i].getQ());
      if ((edges[i].getP() == t) || (edges[i].getQ() == t)){
        return edges[i];
      }
    };
  }

}

function GHSEdge(nodep,nodeq, nodeTarget,weightPQ ){
  var p = nodep;
  var q = nodeq;
  var id = nodep + nodeq;
  var target = nodeTarget;
  var weight = weightPQ;
  var state = 0;//0 - basic; 1 - branch;2 - rejected

  this.getWeight = function(){
    return weight;
  }
  this.getId = function(){
    return id;
  }

  this.getP = function(){
    return p;
  }

  this.getQ = function(){
    return q;
  }

  this.setState = function(s){
    state = s;
  }

  this.getState = function(){
    return state;
  }

  this.getWeight = function(){
    return weight;
  }

  this.getTarget = function(){
    return target;
  }
}

function GHSConnection(n,l){
  var node = n;
  var level = l;
}


 
}); // on dom ready