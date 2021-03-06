String.prototype.hashCode = function(){
    if (Array.prototype.reduce){
        return this.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
    }
    var hash = 0;
    if (this.length === 0) return hash;
    for (var i = 0; i < this.length; i++) {
        var character  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+character;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// load the JSON data about clusters
function getClusterHash() {
    var f_clusters = {};
    $.each(CLUSTERS, function (name, val) {
        if (CLUSTERS[name].type[0].value == "Collection") {
            //f_clusters[name] = {};
            var list_datasets_in_cluster = [];
            for (var i = 0; i < CLUSTERS[name].member.length; i++) {
                var concept_name = CLUSTERS[name].member[i].value;
                list_datasets_in_cluster.push(CLUSTERS[concept_name].definition[0].value);
                //console.log(list_datasets_in_cluster);
            }
            ;
            f_clusters[name] = {};
            f_clusters[name].name = name;
            f_clusters[name].list_datasets = list_datasets_in_cluster;
            f_clusters[name].keywords = listSplitter(CLUSTERS[name].note[0].value);
        }
        ;
    });
    return f_clusters;
};

function getClusterNameFromDatasetName(dsname) {
    var ds_Cluster = getDatasetClusterHash();
    //console.log(ds_Cluster);
    if (ds_Cluster.hasOwnProperty(dsname)) {
        return ds_Cluster[dsname][0];
    } else return "unclustered";
}

function getDatasetClusterHash() {
    var __list_clusters__ = getClusterHash();
    var __datasetClusterHash__ = {};
    $.each(__list_clusters__, function (clustername, content) {
        $.each(content.list_datasets, function (content, ds) {
            //console.log(ds);
           if ( !__datasetClusterHash__.hasOwnProperty(ds)) {
               __datasetClusterHash__[ds] = [];
           }
            __datasetClusterHash__[ds].push(clustername);
        });
    });
    return __datasetClusterHash__;
}

// load the JSON data about the sitg datasets
function getDatasets() {

    $.each(datasets, function (name, content) {
        if (similars.hasOwnProperty(name)) {
            datasets[name].keywords = listSplitter(similars[name].definition[0].value);
            datasets[name].similars = listSplitter(similars[name].note[0].value);
            datasets[name].cluster = getClusterNameFromDatasetName(name);
        };
    });
    return datasets;
};

function hashme(s){
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

function listSplitter(content) {
    var startcontent = content.replace("[", "").replace("]", "");
    var list = [];
    var rowlist = startcontent.split(",");
    for (var i = 0; i < rowlist.length; i++) {
        var a = rowlist[i].split("=");
        var myo = {};
        if (a.length > 0) {
            myo.name = $.trim(a[0]);
            myo.value = parseFloat(a[1]);
        };
        list.push(myo);
    }
    ;
    return list;
};

function getMean(listKeywords) {
    var summe = 0;
    for (i = 0; i < listKeywords.length; i++) {
        summe += listKeywords[i].value;
    }
    return summe / listKeywords.length;
}
/**
 xx-small
 x-small
 small
 medium
 large
 x-large
 xx-large
 */

function gradient(startColor, endColor, steps) {
    var start = {
        'Hex':startColor,
        'R':parseInt(startColor.slice(1, 3), 16),
        'G':parseInt(startColor.slice(3, 5), 16),
        'B':parseInt(startColor.slice(5, 7), 16)
    }
    var end = {
        'Hex':endColor,
        'R':parseInt(endColor.slice(1, 3), 16),
        'G':parseInt(endColor.slice(3, 5), 16),
        'B':parseInt(endColor.slice(5, 7), 16)
    }
    diffR = end['R'] - start['R'];
    diffG = end['G'] - start['G'];
    diffB = end['B'] - start['B'];

    stepsHex = new Array();
    stepsR = new Array();
    stepsG = new Array();
    stepsB = new Array();

    for (var i = 0; i <= steps; i++) {
        stepsR[i] = start['R'] + ((diffR / steps) * i);
        stepsG[i] = start['G'] + ((diffG / steps) * i);
        stepsB[i] = start['B'] + ((diffB / steps) * i);
        stepsHex[i] = '#' + Math.round(stepsR[i]).toString(16) + '' + Math.round(stepsG[i]).toString(16) + '' + Math.round(stepsB[i]).toString(16);
    }
    return stepsHex;

}

function formatKeyWords(list_of_keywords, scaling) {
    var outputlist = "<div id='wordcloud'><p id='wordcloud_content'>" ;
    for (var i = 0; i < list_of_keywords.length; i++) {
        if (scaling) {
            outputlist = outputlist + "<span style='font-size:"
                + list_of_keywords[i].value / getMean(list_of_keywords) * 12 + "pt'>"
                + list_of_keywords[i].name + "</span> ";
        } else {
            outputlist = outputlist + list_of_keywords[i].name + " ";
        }
    }
    outputlist += "</p></div>";
    return outputlist;
};

/*
$(function () {
    jQuery.fn.equalHeight = function () {
        var tallest = 0;
        this.each(function () {
            tallest = ($(this).height() > tallest) ? $(this).height() : tallest;
        });
        return this.height(tallest);
    };
});
*/

function getGexfFromDatasets() {
    var o = "<?xml version='1.0' encoding='UTF-8'?>\n";
    o += "<gexf xmlns='http://www.gexf.net/1.2draft' xmlns:viz='http://www.gexf.net/1.1draft/viz' version='1.2'>\n";
    o += "<graph mode='static' defaultedgetype='directed' >";
    o += "<nodes>\n";
    $.each(datasets, function (name, content) {
        if (similars.hasOwnProperty(name)) {
            datasets[name].similars = listSplitter(similars[name].note[0].value);
        };
        o += "<node id='" + name + "' label='" + datasets[name].title.replace("D'", "") + "'>\n";
        var color;
        if (datasets[name].hasOwnProperty("cluster")) {
            color = toColor(datasets[name].cluster.toString().hashCode());
        } else color = toColor("undefined".hashCode());
        o += "<viz:color r='" + color[0] + "' g='" + color[1] + "' b='" + color[2] + "'></viz:color>\n" ;
        o += "</node>\n";
    });
    o += "</nodes>\n";
    o += "<edges>\n";
    $.each(datasets, function (name, content) {
        if (datasets[name].hasOwnProperty("similars")) {
            $.each(datasets[name].similars, function (i) {
                var target = datasets[name].similars[i].name;
                if( datasets[target] != undefined ) {
                  o += "<edge id='"
                      + name + "_" + target
                      + "' source='" + name
                      + "' target='" + target + "'/>\n";
                }
            });
        }
        ;

    });
    o += "</edges>\n";
    o += "</graph>\n";
    o += "</gexf>\n";
    return o;
};

function format_titre( titre) {
    o = titre.replaceAll("D'", "D ");
    o = titre.replaceAll("d'", "d ");
    o = titre.replaceAll("L'", "L ");
    o = titre.replaceAll("l'", "l ");
    o = titre.replaceAll("'0", " 0");
}
function returnClusterNum(datasetName) {
    return 1;
}

function getd3json2() {
    var links = [];
    $.each(datasets, function (name, content) {
        if (similars.hasOwnProperty(name)) {
            datasets[name].similars = listSplitter(similars[name].note[0].value);
        };
    });
    $.each(datasets, function (name, content) {
        if (datasets[name].hasOwnProperty("similars")) {
            $.each(datasets[name].similars, function (i) {
                var target = datasets[name].similars[i].name;
                var source = name;
                link = {"source":source, "target":target, "type":1};
                links.push(link);
            });
        };
    });
    return links;
};

function getd3json() {
    var o = { "nodes":[ ], "edges":[ ]};
    var node_index = {};
    var index = 0;
    $.each(datasets, function (name, content) {
        if (similars.hasOwnProperty(name)) {
            datasets[name].similars = listSplitter(similars[name].note[0].value);
        }
        ;
        node = {"name":name, "group":returnClusterNum(name) };
        node_index[name] = index;
        index++;
        o.nodes.push(node);
    });
    $.each(datasets, function (name, content) {
        if (datasets[name].hasOwnProperty("similars")) {
            $.each(datasets[name].similars, function (i) {
                var target = node_index[datasets[name].similars[i].name];
                var source = node_index[name];
                edge = {"source":source, "target":target, "value":1};
                o.edges.push(edge);
            });
        }
        ;
    });
    return o;
};


function paintGraph() {
    var sigRoot = document.getElementById('sig');
    var sigInst = sigma.init(sigRoot);
    $.each(datasets, function (name, content) {
        if (similars.hasOwnProperty(name)) {
            datasets[name].similars = listSplitter(similars[name].note[0].value);
        }
        ;
        sigInst.addNode(name, { label:name });
    });
    sigInst.draw();
}

function datasetToHTML(list_datasets, dataset) {
    var aside = "<h4>" + dataset.title + "</h4>"
    aside += "<p><i>" + dataset.organisation + "</i><p>";
    aside += "<p><b>" + dataset.path + "</b><p>";
    aside +=  formatKeyWords(dataset.keywords, true) + "</p></div>";
    aside += "<p>" + dataset.content + "</p>";
    aside += "<h5>Jeux de données similaires</h5>";
    aside += "<ul>"
    $.each(dataset.similars, function (item) {
        var datasetName = dataset.similars[item].name;
        if (list_datasets.hasOwnProperty(datasetName)) {
            var datasetName = list_datasets[datasetName].title;
        }
        aside += "<li><a id='sim_" + item + "' href='#bari'>" + datasetName + "</a></li>";
        $(document).on('click', '#sim_' + item, function (event) {
            var dyn_aside = datasetToHTML(list_datasets,dataset);
            $("#aside").html(dyn_aside);
        });
    });
    aside += "</ul>";
    return aside;
}

function clusterToHTML(list_datasets) {
    var __list_clusters__ = getClusterHash();
    $.each(__list_clusters__, function (cluster, value) {
        $("#nav").append("<div id='"
            + cluster
            + "'><h4><a href='#something'>"
            + getClusterName(cluster) + "</a></h4>" + formatKeyWords(__list_clusters__[cluster].keywords, true) + "</div>");
        $('#' + cluster).click(function (event) {
            var __content_list__ = clusterDatasetListToHTML(__list_clusters__ ,list_datasets, cluster, value);
            $("#section").html(__content_list__);
        });
    });
}


function getClusterName(cluster){
    return cluster.replace("collection_", "Cluster ");
}


function clusterDatasetListToHTML(c ,d, cluster, value) {
    var content_list = "<h2>" + getClusterName(cluster) + "</h2>";
    content_list += formatKeyWords(c[cluster].keywords, true);
    content_list += "<ul>";
    for (var i = 0; i < value.list_datasets.length; i++) {
        var dsName = datasetName = value.list_datasets[i];
        if (d.hasOwnProperty(datasetName)) {
            var datasetName = d[datasetName].title;
        }
        content_list = content_list + "<li><a id='" + dsName + "' href='#foo'>" + datasetName + "</a></li>";
    }
    content_list = content_list + "</ul>";
    return content_list;
}

function clusterCtrl($scope) {
    $scope.clusters = getClusterHash();
}

function datasetCtrl($scope) {
    $scope.datasets = getDatasets();

}



function toColor(num) {
    num >>>= 0;
    var b = num & 0xFF,
        g = (num & 0xFF00) >>> 8,
        r = (num & 0xFF0000) >>> 16,
        a = ( (num & 0xFF000000) >>> 24 ) / 255 ;
    return [r, g, b, a] ;
}








