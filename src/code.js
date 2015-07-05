$(function(){ // on dom ready

  var cy = cytoscape({
    container: document.getElementById('cy'),

    style: cytoscape.stylesheet()
    .selector('node')
    .css({
      'content': 'data(label)',
      'background-color': 'data(bg)',
      'border-color': 'data(bc)',
      'border-width': '3'
    })
    .selector('edge')
    .css({
      'target-arrow-shape': 'data(tas)',
      'source-arrow-shape': 'data(sas)',
      'width': 4,
      'line-color': '#ddd',
      'target-arrow-color': '#ddd',
      'content': 'data(weight)'
    })
    .selector('.highlighted')
    .css({
      'background-color': '#61bffc',
      'line-color': '#61bffc',
      'target-arrow-color': '#61bffc',
      'source-arrow-color': '#61bffc',
      'transition-property': 'background-color, line-color, target-arrow-color,source-arrow-color',
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
    })
    .selector('.rejected')
    .css({
      'background-color': '#ffff00',
      'line-color': '#ffff00',
      'transition-property': 'background-color, line-color, target-arrow-color',
      'transition-duration': '0.5s'

    })
    .selector('.branched')
    .css({
      'background-color': '#ff0000',
      'line-color': '#ff0000',
      'transition-property': 'background-color, line-color, target-arrow-color',
      'transition-duration': '0.5s'

    }),
    layout: {
      name: 'breadthfirst',
      directed: true,
      roots: '#a',
      padding: 10
    },




  });


var colors = ['#ff0000','#ffff00','#00ff00','#0000ff','#000000','#00ffff','#808000','#ff0099','#808080']
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
  var color = colors.pop();
  if (!hasAnySelected()){
    cy.add({
      group: "nodes",
      data: { id : nodeIDCount.toString(),label : nodeIDCount.toString() + ':N', weight: 75, bg:color,  bc :color},
      renderedPosition: { x: e.pageX, y: e.pageY }
    });

    addNodeDiagram(nodeIDCount.toString());

    ghsNodes.push(new GHSNode(nodeIDCount)) ;
   // cy.getElementById("nodeIDCount").style('background-color', '#00ff00');
   nodeIDCount++;
 }
};

////////------------------- Diagrama -------------------///////////

var diagram = null;
var text = document.getElementById('uml').innerText;
var node_s  = document.getElementById('diagram');

var addNodeDiagram = function(number){
  if(node_s.firstChild){
    node_s.removeChild(node_s.firstChild)    
  }
  text = text + 'participant '+number+'\n';
  diagram = Diagram.parse(text);
  diagram.drawSVG("diagram", {theme: 'simple'});
}

var addMessageDiagram = function(message){
  if(node_s.firstChild){
    node_s.removeChild(node_s.firstChild)
  }
  text = text + message+'\n';
  diagram = Diagram.parse(text);
  diagram.drawSVG("diagram", {theme: 'simple'});
}

////////------------------- Fim Diagrama -------------------///////////


var first = null;

document.onclick = function(e){
  if (event.ctrlKey) {
    if(!first){
      first = whoIsSelected()
    } else {
      var second = whoIsSelected();
      cy.add(
        { group: "edges", data: { id:first.id() + second.id() , weight: countEdgeWeight, source: first.id(), target: second.id(),sas : 'none', tas: 'none'} });
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
  if (event.keyCode == 115){
    initialize();
  }
}

var i = 0;
var initialize = function(){
  if (i <= ghsNodes.length - 1) {
    ghsNodes[i].initialize();
    i++;
    setTimeout(initialize(),1000);
  };
}

// kick off first highlight
var nodeIDCount = 0;
var countEdgeWeight = 0;
var ghsNodes = [];
var workers = [];

var getGHSNode = function (id){
  for (var i = ghsNodes.length - 1; i >= 0; i--) {
    if (ghsNodes[i].getId() == parseInt(id)){
      return ghsNodes[i];
    }
  };
}


function GHSEdge(nodep,nodeq, nodeTarget,weightPQ ){
  this.p = nodep;
  this.q = nodeq;
  this.id = nodep + nodeq;
  this.target = nodeTarget;
  this.weight = weightPQ;
  this.state = 0;//0 - basic; 1 - branch;2 - rejected

  this.getWeight = function(){
    return this.weight;
  }
  this.getId = function(){
    return this.id;
  }

  this.getP = function(){
    return this.p;
  }

  this.getQ = function(){
    return this.q;
  }

  this.setState = function(s){
    this.state = s;
  }

  this.getState = function(){
    return this.state;
  }

  this.getWeight = function(){
    return this.weight;
  }

  this.getTarget = function(){
    return this.target;
  }

  this.getPair = function(id){
    if (this.p.getId() == id){
      return this.q;
    } else {
      return this.p;
    }
  }
}

function GHSNode(value){
  this.id = value;
  this.name = 0; // the name of the fragment. Initiallly each node has it own name.
  this.level = 0; // The number of times fragments were united to create the fragmment which this node belongs.
  this.state = 0; // the state of the node, which could be 0 - find, 1 - found.
  this.counter = 0;
  this.parentReport = 0;
  this.bestWeight = 0;
  this.parentOfQ = null;
  this.testEdge;
  this.bestEdge = null;
  this.edges = [];
  this.connections = [];
  this.tests = [];

  this.getId = function() {
    return this.id;
  }

  this.getName = function () { 
    return this.name; 
  }; 

  this.setState = function(s){
    this.state = s;
  }

  this.initialize = function(){
    this.bestEdge = this.findminimal();


    var edge =  cy.getElementById(this.bestEdge.getId());
    if (this.id == this.bestEdge.getP()){  
     edge.data('tas','triangle');
   } else {
     edge.data('sas','triangle');
   }
   edge.addClass("branched");
   this.state = 1;
   this.bestEdge.setState(1);
   this.counter = 0;
   this.parentReport = 0;

   console.log( "[" + this.getId() + "]" + ".initiazize: my best edge is: " + this.bestEdge.getId());
   var node = this;
   var target = this.bestEdge.getTarget();
   setTimeout(function(){
    console.log(node.getId()+ " send Connect" + target.getId());
    addMessageDiagram(node.getId()+'->'+target.getId()+': Connect');
    target.connect(0,node)
   },1000);
 }
 this.findminimal = function(){


   var minEdge = this.edges[0];
   for (var i = this.edges.length - 1; i > 0; i--) {
    if (this.edges[i].weight < minEdge.weight){
      minEdge = this.edges[i];
    }
  };
  return minEdge;   

}

this.addEdge = function(ghsEdge){
  this.edges.push(ghsEdge);
}

this.connect = function(l,q){
  console.log("["+ this.getId() +"]"+"connect. q: " + q.getId()  + " my level: " + this.level  + "q.level" + l);
  var node = this;
  var edge = this.findEdgeByTarget(q.getId());
    console.log("["+ this.getId() +"]"+".connect: edge " + edge.getId()  + "; status: " + edge.getState());

  var level = this.level;
  var target = q;
  if (l < this.level){
    console.log("connect.<");
    setTimeout(function(){
      console.log(node.getId()+ " send Initiate <" + target.getId());
      addMessageDiagram(node.getId()+'->'+target.getId()+': Initiate');
      target.initiate(node.name,level,node.state,node)
    },1000);

    edge.setState(1);
    var edgecy =  cy.getElementById(edge.getId());
    if (this.id == edge.getP()){  
     edgecy.data('tas','triangle');
   } else {
     edgecy.data('sas','triangle');
   }
   edgecy.addClass("branched");
   var edgeCy =  cy.getElementById(edge.getId());
   // edgeCy.addClass("branched");
 } else if (edge.getState() == 1){
  console.log("connect.==");
  setTimeout(function(){
    console.log(node.getId()+ " send Initiate ==" + target.getId() + "; weight: " + edge.getWeight() + "; level:" + level);
    addMessageDiagram(node.getId()+'->'+target.getId()+': Initiate');
    target.initiate(edge.getWeight(),level + 1,0,node)
  },1000);
} else {
  console.log(node.getId() + " connect.else: " + q.getId() + " l: " + l);
  this.connections.push(new GHSConnection(q,l))
}
}

this.initiate = function(fn,l,st,q){
  this.name = fn;
    cy.getElementById(this.id).data('label', this.id + ":" + this.name);

  this.level = l;
  this.state = st;
  console.log("initiate: id> " + this.getId() + " my Parent is" + q.getId());

  this.myParent = q;
  cy.getElementById(this.id).data('bg', cy.getElementById(q.getId()).data('bg'));
//this.bestEdge = null;
this.bestWeight = 999999;
this.counter = 1;
this.parentReport = 0;

for (var i = this.connections.length - 1; i >= 0; i--) {
  console.log("initiate.for1.<: " + i + " : " + this.connections[i].getLevel());
  if (this.connections[i].getLevel() < this.level){
    console.log("initiate.for1.<");
    var edge = this.findEdgeByTarget(this.connections[i].getNode().getId());
    edge.setState(1);
    var edgecy =  cy.getElementById(edge.getId());
    if (this.id == edge.getP()){  
     edgecy.data('tas','triangle');
   } else {
     edgecy.data('sas','triangle');
   }
   edgecy.addClass("branched");
   console.log("l<conn.l " + edge.getId());
   var edgeCy =  cy.getElementById(edge.getId());
   edgeCy.addClass("branched");
   this.connections.slice(i, 1);
     // i--;
   }
 };
 var node = this;

 for (var i = this.edges.length - 1; i >= 0; i--) {
  if (this.edges[i].getState() == 1){
    console.log("["+this.id+"].initiate.for--.!=" + this.edges[i].getId() + " q is " + q.getId() + " target " + this.edges[i].getTarget().getId());
    var pair = this.edges[i].getTarget();
    if (pair.getId() != q.getId()){
      console.log("initiate.for2.!=");
        console.log("send initiate From: " + node.id + " to: " + pair.getId() );
        addMessageDiagram(node.id+'->'+pair.getId()+': Initiate');
        pair.initiate(fn,l,st,node);
    }
  }
};

for (var i = this.tests.length - 1; i >= 0; i--) {
  if (this.tests[i].getLevel() <= this.level){
    console.log("initiate.for3.<:" +this.id + "q:" + this.tests[i].getNode().getId());
    this.replyTest(this.tests[i].getNode(),this.tests[i].getName());
    this.tests.slice(i,1);
     // i--;
   }
 };

 if (this.state == 0){
  console.log("initiate.findMinimalOutgoing.<");
    if (! this.findMinimalOutgoing()){
    this.bestWeight = 999999;
    if (this.counter == this.countBranchEdges()){
        console.log(".initiate == " + this.getId() + " q: " + q.getId() + " counter = " + this.counter + " count= " + this.countBranchEdges());
        //this.counter = 0;
        this.sendReport();
    }
  }
}
}

this.findMinimalOutgoing = function(){
  var minEdge = null;
  for (var i = this.edges.length - 1; i >= 0; i--) {
    console.log("findMinimalOutgoing, edge: " +this.edges[i].getId()+ " ; state: " + this.edges[i].getState());
    if (this.edges[i].getState() == 0){
      if (minEdge != null){
        if (this.edges[i].getWeight() < minEdge.getWeight() ){
          console.log("findMinimalOutgoing.if.<");
          minEdge = this.edges[i];
        }
      } else {
        console.log("findMinimalOutgoing.else");
        minEdge = this.edges[i];
      }
    }
  };


  var node = this;
  if (minEdge != null){
    console.log("findMinimalOutgoing.if.!= " + this.id +" outgoing "+ minEdge.getId());
    this.testEdge = minEdge;
    setTimeout(function(){
      addMessageDiagram(node.getId()+'->'+minEdge.getTarget().getId()+': Test');
      minEdge.getTarget().teste(node.name,node.level,node)
    },1000);  
    return true;
  } else {
    this.testEdge = null;
    return false;
  }
}

this.teste = function(fn,l,n){
  console.log("teste.if.< " +this.level + " l: " + l);
  if (l <= this.level){
    console.log("teste.if this "+ this.id + " q: "+ n.getId() );
    this.replyTest(n,fn);
  } else {
    console.log("teste.else "+ this.id + " q: "+ n.getId() );
    this.tests.push(new Test(n,fn,l));
  }
}

this.replyTest = function(q,fn){
  var node = this;
  if (this.name != fn){
    console.log("replyTest.if.!= from " + this.id + " to " +q.getId());    
    setTimeout(function(){
      addMessageDiagram(node.getId()+'->'+q.getId()+': Accept');
      q.acceptE(node)
    },1000);
  } else {
    console.log("replyTest.else");
    var edge = this.findEdgeByTarget(q.getId());
    edge.setState(2);
    var edgecy =  cy.getElementById(edge.getId());
    if (this.id == edge.getP()){  
     edgecy.data('tas','triangle');
   } else {
     edgecy.data('sas','triangle');
   }
   edgecy.addClass("rejected");
  //  edge.getTarget().setEdgeState(2,this);
  if ((this.testEdge == null) || (this.testEdge.getId() != edge.getId())){
    console.log("replyTest.else.if.!="+ this.id + " to " +q.getId());
    setTimeout(function(){
      addMessageDiagram(node.getId()+'->'+q.getId()+': Reject');
      q.rejectE(node)
    },1000);

  } else {
    console.log("replyTest.else.if.else");
  if (! this.findMinimalOutgoing()){
    this.bestWeight = 999999;
    if (this.counter == this.countBranchEdges()){
        console.log(".replyTest: == " + this.getId() + " q: " + q.getId() + " counter = " + this.counter + " count= " + this.countBranchEdges());
        //this.counter = 0;
        this.sendReport();
    }
  }  }
}
}

this.setEdgeState = function(s,q){
  var edge = this.findEdgeByTarget(q.getId());
  edge.setState(s)
  if (s == 1){
   var edgecy =  cy.getElementById(edge.getId());
   if (this.id == edge.getP()){  
     edgecy.data('tas','triangle');
   } else {
     edgecy.data('sas','triangle');
   }
   edgecy.addClass("branched");
 }
}

this.acceptE = function(q){
  this.testEdge = null;
  console.log("acceptE: " + this.getId() + " q: " + q.getId());
  var edge = this.findEdgeByTarget(q.getId());
  if (edge.getWeight() < this.bestWeight){
    console.log("acceptE: bestEdge of " + this.getId() + " is " + edge.getId());
    this.bestEdge = edge;
    this.bestWeight = edge.getWeight();
    var edgecy =  cy.getElementById(this.bestEdge.getId());
    if (this.id == this.bestEdge.getP()){  
     edgecy.data('tas','triangle');
   } else {
     edgecy.data('sas','triangle');
   }
   edgecy.addClass("highlighted");
 }

 if (this.counter == this.countBranchEdges()){
   console.log("acceptE: == " + this.getId() + " q: " + q.getId() + " counter = " + this.counter + " count= " + this.countBranchEdges());
 //this.counter = 0;
   this.sendReport();
 }
}

this.countBranchEdges = function(){
  var count = 0;
  for (var i = this.edges.length - 1; i >= 0; i--) {
    if (this.edges[i].getState() == 1){
      count++;
    }
  };
  return count;
}

this.sendReport = function(){
  var node = this;
  var bestWeightSnip = this.bestWeight;
  this.state = 1;
    console.log("sendReport: parent of " + this.id + " is " + this.myParent.getId());
    setTimeout(function(){
      addMessageDiagram(node.getId()+'->'+node.myParent.getId()+': Report');
      node.myParent.report(bestWeightSnip,node)
    },1);
  if ((this.parentReport > 0) && (this.bestWeight < this.parentReport)) {
   console.log("sendReport: and");
    this.changeRoot();
 }
}

this.report = function(w,q){
  console.log("[" + this.id + "].report:" + q.getId() + " this.counter " + this.counter);
  var node = this;
  if (q.getId() != this.myParent.getId()){
    this.counter++;
    if (w < this.bestWeight){
     // console.log("report: <" + this.getId());
     var edge = this.findEdgeByTarget(q.getId());
     console.log("report: < bestEdge" + this.getId() + " is" + edge.getId() );
     this.bestEdge = edge;
     this.bestWeight = w;
     var edgecy =  cy.getElementById(this.bestEdge.getId());
     if (this.id == this.bestEdge.getP()){  
       edgecy.data('tas','triangle');
     } else {
       edgecy.data('sas','triangle');
     }
     edgecy.addClass("highlighted");
   }
   console.log("report: < countBranchEdges: " + this.countBranchEdges() + " this.counter " + this.counter);
   if ((this.counter == this.countBranchEdges()) && (this.testEdge == null)){
     console.log("report: ==B " + this.getId());
    // this.counter = 0;
     this.sendReport();
   }
 } else if(this.state == 0){
   console.log("report: ==0 " + this.getId());
   this.parentReport = w;
 } else {
  if (this.bestWeight < w){
    console.log("report: <n" + this.getId());
    this.changeRoot();
    //setTimeout(function(){node.changeRoot()},1000);
  } else if (w == 999999){
   console.log("report: fim" + this.getId());
   console.log("fim");
 }
}
}

this.changeRoot = function(){
 // if (this.bestEdge != null){
  var node = this;
  var levelSnipt = this.level;
  var bestWeightSnipt = this.bestWeight;
  console.log("["+this.id+"]changeRoot: this is" + this.getId());
  console.log("["+this.id+"]changeRoot: the best edge is" + this.bestEdge.getId());

  if (this.bestEdge.getState() == 1){
    console.log("["+this.id+"]changeRoot: if" + this.getId());
    setTimeout(function(){
      addMessageDiagram(node.getId()+'->'+node.bestEdge.getTarget().getId()+': Change Root');
      node.bestEdge.getTarget().changeRoot()
    },1000);
  } else {
    console.log("["+this.id+"]changeRoot: else" + this.getId());

    this.bestEdge.setState(1);
    var edgecy =  cy.getElementById(this.bestEdge.getId());
    if (this.id == this.bestEdge.getP()){  
     edgecy.data('tas','triangle');
   } else {
     edgecy.data('sas','triangle');
   }
   edgecy.addClass("branched");
    setTimeout(function(){
      addMessageDiagram(node.getId()+'->'+node.bestEdge.getTarget().getId()+': Connect');
      node.bestEdge.getTarget().connect(levelSnipt,node)
    },1000);

   
   var i = this.findBestEdge();
   if (i > -1){
    console.log("["+this.id+"]changeRoot: if >" + this.getId());
    setTimeout(function(){
      addMessageDiagram(node.getId()+'->'+node.bestEdge.getTarget().getId()+': Initiate');
      node.bestEdge.getTarget().initiate(bestWeightSnipt,levelSnipt + 1,0,node)
    },1000);   
    this.connections.slice(i,1);
  }
}
 // }
}

this.findBestEdge = function(){
  for (var i = this.connections.length - 1; i >= 0; i--) {
    if (this.connections[i].getNode().getId() == this.bestEdge.getTarget().getId()){
      return i;
    }
  };
  console.log(".findBestEdge not found!")
  return -1;
}

this.rejectE = function(q){
  console.log("rejectE: " + this.getId() + " q: " + q.getId());
  var edge = this.findEdgeByTarget(q.getId());
  edge.setState(2);
  if (! this.findMinimalOutgoing()){
    this.bestWeight = 999999;
    if (this.counter == this.countBranchEdges()){
        console.log("rejectE: == " + this.getId() + " q: " + q.getId() + " counter = " + this.counter + " count= " + this.countBranchEdges());
        //this.counter = 0;
        this.sendReport();
    }
  }
}

this.findEdgeByTarget = function(t){
  for (var i = this.edges.length - 1; i >= 0; i--) {
     //alert("t: " + t +"p: " + edges[i].getP() + " q: " + edges[i].getQ());
     if ((this.edges[i].getP() == t) || (this.edges[i].getQ() == t)){
      return this.edges[i];
    }
  };
  console.log("[" + this.getId() + "]" + "not found edge for :" + t);
}

function GHSConnection(n,l){
  this.node = n;
  this.level = l;

  this.getNode = function(){
    return this.node;
  }

  this.getLevel = function(){
    return this.level;
  }

}
}

function Test(n,fn,l){
  this.node = n;
  this.name = fn;
  this.level = l;

  this.getNode = function() {
    return this.node;
  }

  this.getName = function(){
    return this.name;
  }

  this.getLevel = function(){
    return this.level;
  }
}



}); // on dom ready