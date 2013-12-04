// load the JSON data about clusters
function getClusterHash() {
    var f_clusters = {};
    $.each(clusters, function (name, val) {
        if (clusters[name].type[0].value == "Collection") {
            //f_clusters[name] = {};
            var list_datasets_in_cluster = [];
            for (var i = 0; i < clusters[name].member.length; i++) {
                var concept_name = clusters[name].member[i].value;
                list_datasets_in_cluster.push(clusters[concept_name].definition[0].value);
                //console.log(list_datasets_in_cluster);
            }
            ;
            f_clusters[name] = {};
            f_clusters[name].list_datasets = list_datasets_in_cluster;
            f_clusters[name].keywords = listSplitter(clusters[name].note[0].value);
        }
        ;
    });
    return f_clusters;
};

// load the JSON data about the sitg datasets
function getDatasets() {
    $.each(datasets, function (name, content) {
        if (similars.hasOwnProperty(name)) {
            datasets[name].keywords = listSplitter(similars[name].definition[0].value);
            datasets[name].similars = listSplitter(similars[name].note[0].value);
        }
        ;
    });
    return datasets;
};

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
        }
        ;
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
    var outputlist = "";
    for (var i = 0; i < list_of_keywords.length; i++) {
        if (scaling) {
            outputlist = outputlist + "<span style='font-size:"
                + list_of_keywords[i].value / getMean(list_of_keywords) * 12 + "pt'>"
                + list_of_keywords[i].name + "</span> ";
        } else {
            outputlist = outputlist + list_of_keywords[i].name + " ";
        }
    }
    ;
    return outputlist;
};

$(function () {
    jQuery.fn.equalHeight = function () {
        var tallest = 0;
        this.each(function () {
            tallest = ($(this).height() > tallest) ? $(this).height() : tallest;
        });
        return this.height(tallest);
    };
});

function getGexfFromDatasets() {
    var o = "<?xml version='1.0' encoding='UTF-8'?>\n";
    o += "<gexf xmlns='http://www.gexf.net/1.2draft' version='1.2'>\n";
    o += "<graph mode='static' defaultedgetype='directed' >";
    o += "<nodes>\n";
    $.each(datasets, function (name, content) {
        if (similars.hasOwnProperty(name)) {
            datasets[name].similars = listSplitter(similars[name].note[0].value);
        }
        ;
        o += "<node id='" + name + "' label='" + name + "'/>\n";
    });
    o += "</nodes>\n";
    o += "<edges>\n";
    $.each(datasets, function (name, content) {
        if (datasets[name].hasOwnProperty("similars")) {
            $.each(datasets[name].similars, function (i) {
                var target = datasets[name].similars[i].name;
                o += "<edge id='"
                    + name + "_" + target
                    + "' source='" + name
                    + "' target='" + target + "'/>\n";
            });
        }
        ;

    });
    o += "</edges>\n";
    o += "</graph>\n";
    o += "</gexf>\n";
    return o;
};

function returnClusterNum(datasetName) {
    return 1;
}

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

function datasetToHTML(d, value) {
    var aside = "<h4>" + value.title + "</h4>"
    aside += "<p><i>" + value.organisation + "</i><p>";
    aside += "<p><b>" + value.path + "</b><p>";
    aside += "<p id='cluster'>" + formatKeyWords(value.keywords, true) + "</p>";
    aside += "<p>" + value.content + "</p>";
    aside += "<h5>Jeux de données similaires</h5>";
    aside += "<ul>"
    $.each(value.similars, function (item) {
        var datasetName = value.similars[item].name;
        if (d.hasOwnProperty(datasetName)) {
            var datasetName = d[datasetName].title;
            //console.log(datasetName);
        }
        aside += "<li>" + datasetName + "</li>";
    });
    aside += "</ul>";
    return aside;
}

function clusterToHTML(d) {
    var c = getClusterHash();
    $.each(c, function (cluster, value) {
        $("#nav").append("<div id='"
            + cluster
            + "'><h4><a href='#something'>"
            + getClusterName(cluster) + "</a></h4><p id='cluster'>" + formatKeyWords(c[cluster].keywords, true) + "</p></div>");
        $('#' + cluster).click(function (event) {
            var content_list = clusterDatasetListToHTML(c ,d, cluster, value);
            $("#section").html(content_list);
        });
    });
}

function getClusterName(cluster){
    return cluster.replace("collection_", "Cluster ");
}


function clusterDatasetListToHTML(c ,d, cluster, value) {
    var content_list = "<h2>" + getClusterName(cluster) + "</h2>";
    content_list += "<p id='cluster'>" + formatKeyWords(c[cluster].keywords, true) + "</p>";
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








