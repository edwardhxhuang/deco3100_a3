const corruptWords = ["loser", "idiot", "dummy", "evil", "dumb", "stupid", "fool", "false", "misleading","shifty", "plot",  "fabricate", "conspiracy", "collusion", "scandal", "illegal", "corrupt", "scam", "dishonest", "fake", "hoax", "witch", "rigged", "fraud", "crook", "counterfeit", "lamestream", "phoney"];

function unpack(rows, key) {
  return rows.map(function(row) { return row[key]; });
}

function corruption_filter(trump_tweets, tsne_data_trump) {
  //add tsne data to tweets
  
  let tweets = trump_tweets.map((trump_tweet, index) => Object.assign(trump_tweet, tsne_data_trump[index]))

  //only include tweets containing one of these strings
  //Try experimenting with different search tags
  // tweets = tweets.filter(tweet => ["climate", "energy", "green", "solar"].some(topic => tweet.text.includes(topic)));
  // tweets = tweets.filter(tweet => ["jobs", "unemployment", "industry"].some(topic => tweet.text.includes(topic)));

  let corruptPhrases = ["deep state"]

  // Counter used to to double check sentiment and tweet count from filter in console
  var count = 0
  var sentimentTotal = 0

  let corruptTweets = tweets.filter(tweet => {
    // creates an array that looks like [ ['sentiment', 0.44444], [ 'text', 'fdsfdsf' ] ... ['token_0', 'fake' ] ... ['token_5', 'news' ] ]
    let entries = Object.entries(tweet);

    // creates a variable array that only includes the words by isolating the tokens and ignoring id, full tweet, etc. 
    let wordsInTweet = entries.filter(entry => entry[0].includes('token_')).map(tokenEntry => {
      return tokenEntry[1];
    });
    // first check if word form corruptWords array exists in isolated words
    let checkForCorruptWords = wordsInTweet.some(word => {
      return word && corruptWords.includes(word.toLowerCase());
    });

    // secondly check if phrases(more exact string) exists in tex
    let checkForCorruptPhrases = corruptPhrases.some(badPhrase => {
        return tweet.text.toLowerCase().includes(badPhrase)
    });
    if (checkForCorruptWords === true || checkForCorruptPhrases === true) {
      count++;
      sentimentTotal += Number(tweet.sentiment)
    }
    return checkForCorruptWords || checkForCorruptPhrases

  });

  //tweets = tweets.filter(tweet => [""].some(topic => tweet.text.includes(topic)));

  //Try out some of these other filters!
  //tweets = tweets.filter(tweet => tweet.text.includes("thank"))
  //tweets = tweets.filter(tweet => tweet.sentiment > 0.5) //positive tweets
  //tweets = tweets.filter(tweet => tweet.sentiment < 0) //negative tweets
  //tweets = tweets.filter(tweet => tweet.sentiment < -0.5) //negative tweets
  //tweets = tweets.filter(tweet => new Date(tweet.datetime) < new Date(2014, 0, 0))
  //tweets = tweets.filter(tweet => new Date(tweet.datetime) > new Date(2015, 6, 3) && new Date(tweet.datetime) < new Date(2015, 6, 5))


  console.log("Tweet Count: " + count)
  console.log("Sentiment Tally: " + sentimentTotal)
  console.log("Sentiment Average: " + (sentimentTotal / count))
  
  let monthFrequency = corruptTweets.reduce((tweetsPerYearMonth, tweet) => {

    let yearMonth = tweet.date.substring(0, 7);
    // check if month has been seen before
    if (!tweetsPerYearMonth[yearMonth]) { 
        // if first time seeing this month, set frequency to 1
        tweetsPerYearMonth[yearMonth] = {date: yearMonth, frequency: 1};
    } else {
        // otherwise add 1 to frequency
        tweetsPerYearMonth[yearMonth].frequency++;
    }
    // return accumulator
    return tweetsPerYearMonth;

  }, {});

  return {corruptTweets, monthFrequency};
}

function filter_vocab(vocab) {
  // filter out 'corrupt' words from vocab csv data
  let corruptVocab = vocab.filter(voc => corruptWords.some(topic => voc.word.includes(topic)));
  topVocab = corruptVocab.filter(voc => voc.trump_count > 40);
  return topVocab
  
};

// US Chloropleth Map
function make_map(rows, selection, colourblind) {
  // Custom variables that will change depending on which data the user wants to view from the dropbox
  var selectedData;
  var scaleMin;
  var scaleMax;
  var scaleColours;
  var scaleTitle;
  var template;
  var custom;

  //check which state the dropbox is in and set the appropriate custom variable values
  if (selection === 'mentions') {
    selectedData = unpack(rows, 'trump_mention_per_vote'),
    custom = unpack(rows, 'population'),
    scaleMin = 0, 
    scaleMax = 12.2,
    scaleTitle = 'Mentions',
    template = ("<b>%{text}</b><br>" +
    "Population: %{customdata}<br>" +
    "Mentions per electoral votes: %{z:.1f}<br>" +
    "<extra></extra>"),
    scaleColours = [
      [0, 'rgb(242,240,247)'], [0.2, 'rgb(218,218,235)'],
      [0.4, 'rgb(188,189,220)'], [0.6, 'rgb(158,154,200)'],
      [0.8, 'rgb(117,107,177)'], [1, 'rgb(84,39,143)']
    ]
  }
  else {
    selectedData = unpack(rows, 'trump_sentiment'),
    custom = unpack(rows, 'trump_count'), 
    scaleMin = 0.12,
    scaleMax = 0.3,
    scaleTitle = 'Sentiment',
    template = ("<b>%{text}</b><br>" +
    "Mentions: %{customdata}<br>" +
    "Sentiment: %{z:.1f}<br>" +
    "<extra></extra>")
    // Check if colourblind toggle is on - if so, change colourscale to enhance contrast
    if (colourblind === true) {
      scaleColours = [
        [0, 'rgb(247, 0, 0)'], 
        [0.5, 'rgb(238, 255, 254)'],
        [1, 'rgb(127, 217, 91)']
      ]
    }
    else {
      scaleColours = [
        [0, 'rgb(255, 102, 101)'], 
        [0.5, 'rgb(238, 255, 254)'],
        [1, 'rgb(110, 185, 114)']
      ]
    }
  }
  
  var data = [{
    type: 'choropleth',
    locationmode: 'USA-states',
    locations: unpack(rows, 'code'),
    z: selectedData,
    text: unpack(rows, 'state'),
    customdata: custom, 
    hovertemplate: template,
    zmin: scaleMin,
    zmax: scaleMax,
    colorscale: scaleColours,
    colorbar: {
        title: scaleTitle,
        thickness: 10
    },
    marker: {
        line:{
            color: 'rgb(255,255,255)',
            width: 2
        }
    }
    }];

  var layout = {
      // title: 'Mentions of US States per electoral vote',
      geo:{
          scope: 'usa',
          showlakes: true,
          lakecolor: 'rgb(255,255,255)'
      },
      // width: 300,
      // height: 300,
      margin: {
        // l: 0,
        // r: 0,
        b: 0,
        t: 0,
        pad: 0
      }
  };

  Plotly.newPlot("states", data, layout, {showLink: false, displayModeBar: false});
}


// Twitter Mentions Bar Chart 
function make_barChart(csvData, selection) {
  // Variables that will change depending on dropdown selection
  var mentionsRange = [0,250];
  var popRange = [0,40000000];
  // Set variables to values depending on dropdown value
  if (selection === 'most') {
    var mentions = csvData.filter(row => {
      popRange = [0,40000000]
      row = row.trump_count > 125
      return row
    })
  }
  else {
    mentionsRange = [0,50]
    popRange = [0,10000000];
    var mentions = csvData.filter(row => {
      row = row.trump_count < 8
      return row
    })
  }  

  let count = [], state = [], pop = []
  // loop through tweets that mention specific states and append values into declared arrays
  for (let i=0; i< mentions.length; i++) {
    row = mentions[i];
    count.push( row['trump_count'] );
    state.push( row['state'] );
    pop.push ( row['population'])
  }

  var data = [{
    x: state,
    y: count,
    name: 'Mentions',
    type: 'bar',
    offsetgroup: 1,
    yaxis: 'y1'
  },
  {
    x: state,
    y: pop,
    name: 'Population',
    type: 'bar',
    yaxis: 'y2',
    offsetgroup: 2,
    marker: {
      color: 'rgb(215, 215, 234)',
    }
  }
  ];
  
  var layout = {
    barmode: 'group',
    yaxis: {
      title: 'Twitter Mentions',
      range: mentionsRange
      },
    yaxis2: {
      title: 'State Population', 
      range: popRange,
      overlaying: 'y',
      side: 'right'
    },
    font: {
      family: 'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"',
      size: 12
    },
    margin: {
        l: 45,
        // r: 30,
        // b: 30,
        t: 0,
    },
    legend: {
      x: 0.8,
      y: 1.2
    }
  };
  Plotly.newPlot('states-bar', data, layout, {displayModeBar: false});
}

// Corrupt Tweets Line Graph
function make_line(tweets){
  tweets = Object.values(tweets)
  let data = [{
    x: tweets.map(d => d.date),
    y: tweets.map(d => d.frequency),
    mode: 'lines+markers'
  }]

  var selectorOptions = {
    buttons: [{
        step: 'month',
        stepmode: 'backward',
        count: 6,
        label: '6m'
    }, {
        step: 'year',
        stepmode: 'backward',
        count: 1,
        label: '1y'
    }, {
      step: 'year',
      stepmode: 'backward',
      count: 2,
      label: '2y'
    }, {
        step: 'all',
    }],
  };
  let layout = {
    margin: {
        l: 30,
        r: 30,
        t: 10,
        b: 25
    },
    xaxis: {
      rangeselector: selectorOptions,
      rangeslider: {},
      range: ["2019-02", "2021-01"],
      autorange: false,
      // autorange: true,
    },
    annotations: [
      {
        x: "2020-11",
        y: 109,
        xref: 'x',
        yref: 'y',
        text: 'Presidential Election',
        showarrow: true,
        arrowhead: 7,
        ax: -20,
        ay: -25,
      },
      {
        x: "2019-10",
        y: 129,
        xref: 'x',
        yref: 'y',
        text: 'Impeachment Inquiry',
        showarrow: true,
        arrowhead: 7,
        ax: -85,
        ay: 0,
      },
      {
        x: "2018-08",
        y: 93,
        xref: 'x',
        yref: 'y',
        text: 'Investigation into Election Meddling',
        showarrow: true,
        arrowhead: 7,
        ax: -20,
        ay: -25,
      },
      {
        x: "2019-04",
        y: 81,
        xref: 'x',
        yref: 'y',
        text: 'Mueller Report Released',
        showarrow: true,
        arrowhead: 7,
        ax: 0,
        ay: -25,
      },
      {
        x: "2020-05",
        y: 94,
        xref: 'x',
        yref: 'y',
        text: 'COVID-19 Response',
        showarrow: true,
        arrowhead: 7,
        ax: 0,
        ay: -25,
      }
    ]
  }
  Plotly.newPlot('lineChart', data, layout, {displayModeBar: false});
}

// Cluster Chart
function make_cluster(tweets, selectDate){
  document.getElementById("selectedDate").innerHTML = "Selected Period: " + dateFormat(selectDate, "mmmm yyyy");
  let selectTweets = tweets.filter(tweet => tweet.date.substring(0, 7) === selectDate);
  // console.log(selectTweets);
  let data = [{
    x: selectTweets.map(d => d.x),
    y: selectTweets.map(d => d.y),
    customdata: selectTweets.map(d => convertToParagraph("<b>@realDonaldTrump (" + dateFormat(d.date,"dd-mm-yy") + "): </b>" + d.text, 64)),
    marker: {
      color: tweets.map(d => d.sentiment),
      // color: tweets.map(d => d.author=="Trump"?0:1), //color 0 if trump, 1 if obama
      size: 15,
      colorscale: [ //custom color scheme
        ['0.0', 'rgb(166, 55, 22)'],
        ['0.25', 'rgb(204, 115, 77)'],
        ['0.5', 'rgb(199, 205, 209)'],
        ['0.75', 'rgb(116, 149, 166))'],
        ['1.0', 'rgb(21, 96, 122)'],
      ]
    },
    mode: 'markers',
    type: 'scatter',
    hovertemplate:
      "%{customdata}" +
      "<extra></extra>", //hide extra tooltip info
  }];

  let layout = {
    hovermode: "closest", //hover closest by default
    xaxis: {
      visible: false,
    },
    yaxis: {
      visible: false,
    }
  }

  Plotly.newPlot('cluster', data, layout, {displayModeBar: false});
}

// Radar Chart
function make_radar(vocab){
  data = [{
    type: 'scatterpolar',
    r: vocab.map(d => d.trump_count),
    theta: vocab.map(d => d.word),
    text: "Unpresidential Vocabulary",  
    hovertemplate: "<b>Frequency: </b>%{r} <extra></extra>",
    fill: 'toself',
    marker: {
      color: 'rgb(220, 82, 65)'
    }
  }]
  
  layout = {
    margin: {
      // l: 0,
      // r: 0,
      b: 30,
      t: 30,
      pad: 10
    },
    font: {
      family: 'ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"',
      size: 14  
    },
    polar: {
      radialaxis: {
        visible: true,
        range: [0, 1172]
      }
    },
    showlegend: false
  }
  
  Plotly.newPlot("radar", data, layout, {displayModeBar: false})
}

//from https://codereview.stackexchange.com/a/171857
function convertToParagraph(sentence, maxLineLength){
  let lineLength = 0;
  sentence = sentence.split(" ")
  return sentence.reduce((result, word) => {
    if (lineLength + word.length >= maxLineLength) {
      lineLength = word.length;
      return result + `<br>${word}`;
    } else {
      lineLength += word.length + (result ? 1 : 0);
      return result ? result + ` ${word}` : `${word}`;
    }
  }, '');
}

function runPlotly(filters) {
  const {barChart, cluster, map} = filters
  Plotly.d3.csv("data/trump_presidential_tweets.csv", (trump_tweets) => {
    Plotly.d3.csv("data/presidential_vocabulary.csv", (vocab) => {
      Plotly.d3.csv("data/tsne_and_cluster/tsne_data_trump.csv", (tsne_data_trump) => {
        Plotly.d3.csv('data/states.csv', (state_data) => {
          let tweets = corruption_filter(trump_tweets, tsne_data_trump)
          let topVocab = filter_vocab(vocab);
          if (barChart) {
            make_barChart(state_data, barChart);
          }
          if (cluster) {
            make_cluster(tweets.corruptTweets, cluster);
          }
          if (map) {
          make_map(state_data, map, colourblind);
          make_line(tweets.monthFrequency);
          make_radar(topVocab);

          // Line Graph Click Interaction
          let pt
          let selectDate
          lineChart.on('plotly_click', function(data){
            for(var i=0; i < data.points.length; i++){
              // identify which point has been clicked
              pt = data.points[i].pointNumber
              // use the coordinate to locate and store the YYYY-MM date in a variable
              selectDate = data.points[i].data.x[pt];
            };
            // Replot Cluster
            make_cluster(tweets.corruptTweets, selectDate)
          });
          }
        });
      });
    });
  });
}

runPlotly({barChart: "most", cluster: "2020-11", map: "mentions"});

var barChartSelector = document.querySelector("#barChartSelector");
barChartSelector.addEventListener("change", updateBarChart, false);
function updateBarChart(event) {
  runPlotly({barChart: event.target.value})
}

var mapSelector = document.querySelector("#mapSelector");
mapSelector.addEventListener("change", mapChart, false);
function mapChart(event) {
  if (event.target.value === "sentiment") {
    document.getElementById('colourblind').style.visibility = 'visible';
  }
  else {
    document.getElementById('colourblind').style.visibility = 'hidden';
  }
  runPlotly({map: event.target.value})
}

//toggle for colourblindness
document.getElementById('colourblind').style.visibility = 'hidden'
var colourblind = false;
function colourToggle() {
  
  if (colourblind === false) {
    colourblind = !colourblind
    document.getElementById("colourblind").className = "bg-gray-600 hover:bg-gray-800 text-white font-semibold py-2 px-4 border border-gray-800 rounded";
    document.getElementById("colourblind").value= "Colourblind Mode: On";
    }
    else {
      colourblind = false
      document.getElementById("colourblind").className = "bg-transparent hover:bg-gray-600 text-gray-800 hover:text-white py-2 px-4 border border-gray-600 hover:border-transparent rounded";
      document.getElementById("colourblind").value = "Colourblind Mode: Off";
    }
    runPlotly({map: "sentiment"})
  };