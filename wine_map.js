

var width = 1300, height = 800, centered;


var div = d3.select("body").append("div")   
    .attr("class", "tooltip")            
    .style("opacity", 0);

color_map={'rouge':'DarkRed', 'blanc':'PaleGoldenRod', 'cognac_armagnac':'SandyBrown','rose':'DarkSalmon','vsi_vci':'Gainsboro',
'aop':'DarkGreen','vsig':'GreenYellow','igp':'LimeGreen' }

legend_map={'rouge':'Red wine', 'blanc':'White wine','rose':'Rosé', 'cognac_armagnac':'Wine for cognac and armagnac production','vsi_vci':'Wine put in reserve',
'aop':'AOP (protected designation of origin)','igp':'IGP (protected geographical indication)','vsig':'Wine without protected geographical indication'}


init_map(datapath= 'http://localhost:8000/wine_data.json')

init_data(datapath= 'http://localhost:8000/wine_data.json')



function init_map(datapath){  

	var projection = d3.geoConicConformal()
	    .center([2.454071, 46.279229])
	    .scale(4000)
	    .translate([width / 2, height / 2]); 

	map_path = d3.geoPath() //GLOBAL
	         .projection(projection); 


	d3.json(datapath, function(req, geojson) {
	                    
	                    var france= geojson.features

	                    svg = d3.select('#map').append("svg") 
	                        .attr("id", "svg")
	                        .attr("width", width)
	                        .attr("height", height);
                          

	                    g = svg.append("g")

                       
                      dpts=g.selectAll(".dept")
                                .data(france)
                                .enter()
                                .append("g")
                                .attr("class",'dept')
                                .attr('name',function(d) {return d.properties.NOM_DEPT;})
                                .attr('id',function(d) {return d.properties.CODE_DEPT;})
                                .on("click",clicked)

                      dpts.append("path")
                          .attr('class', 'border')
                          .attr("d", map_path)
                          .attr("stroke",'black')
                          .attr("stroke_width",5)
                          .attr('fill','white')
                          

                                ;})
}

function init_data(datapath){ 

d3.json(datapath, function(req, geojson) {

                      var france= geojson.features                        

                      pies = g.selectAll(".pie") 
                          .data(france)
                          .enter().append("g")
                          .attr("class", "pie")
                          .attr('name',function(d) {return d.properties.NOM_DEPT;})
                          .attr("transform", function(d) {return "translate(" + map_path.centroid(d)[0] + "," +  map_path.centroid(d)[1] + ")"})
                          .on("click",clicked);


                      var arc = d3.arc()
                           .outerRadius(function(){var d=d3.select(this.parentNode.parentNode).data(); return Math.sqrt(d[0].properties.superficie_vigne.aop+d[0].properties.superficie_vigne.igp+d[0].properties.superficie_vigne.vsig+d[0].properties.superficie_vigne.cognac_armagnac)/10}) //
                           .innerRadius(0);

                      var pie_generator = d3.pie()
                                            .value(function(d){for (key in d) {var ret=d[key]};return ret})                      
                                            .sort(null)
                  

                      var pie =pies.selectAll("path")
                              .data(function(d) {return pie_generator(d.properties.production_vin)}) //customise pie to put the radius inside?
                              .enter().append("g")
                              .attr("class", "arc");

                      pie.append("path")
                            .attr("d", arc)
                            .style("fill",function(d){for (key in d.data) {var ret=key};return color_map[ret]})
                            .on("mouseover",function(d){
                                var pd=d3.select(this.parentNode.parentNode).data()[0]
                                div.transition()        
                                    .duration(200)
                                    .style("opacity", .9)
                                div.html(function() {
                                  for (key in d.data) {var wine=key; var prod=d.data[key]};
                                  var total=0
                                  var initial_array=pd.properties.production_vin;
                                       for (var i=0; i<initial_array.length; i++) {
                                                for(key in initial_array[i])
                                                {
                                                  total = total + initial_array[i][key];
                                                } 
                                            }
                                  return " "+pd.properties.NOM_DEPT + "<br>" + legend_map[wine] + "<br><br>"
                                      +  "Production : " + prod +" hl "+" ("+Math.round(10000*prod/total)/100+"%)"})  
                                    .style("left", (d3.event.pageX + 10) + "px")     
                                    .style("top", (d3.event.pageY - 10) + "px")})
                          .on("mouseout", function(d) {
                              div.transition()
                                  .duration(0)
                                  .style("opacity", 0);
                              div.html("")
                                  .style("left", "0px")
                                  .style("top", "0px");
                                });
                            });                              
}

function clicked(d){
  var x, y, k;
  try { dpt=d.properties.NOM_DEPT}
  catch(TypeError) {}

  var r=d3.selectAll("rect").transition().duration(1000)
      .style("fill-opacity", 0)

  d3.selectAll(".bar").transition()
      .delay(1000).remove()

  div.transition()
      .duration(0)
          .style("opacity", 0);
      div.html("")
          .style("left", "0px")
          .style("top", "0px");

  if (centered !== dpt) 
  {
    var centroid = map_path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    //k = 5;
    pie_radius = Math.sqrt(d.properties.superficie_vigne.aop+d.properties.superficie_vigne.igp+d.properties.superficie_vigne.vsig+d.properties.superficie_vigne.cognac_armagnac)/10
    if(pie_radius>0)
    {
      k = 5*20/(1+pie_radius)
      centered = dpt;
    }
    else
    {
      x = width / 2;
      y = height / 2;
      k = 1;
      centered = null;
    }

  } 
  
  else 
  {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

 g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(1500)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px")
      .on('end', function()
      {
         if (centered == dpt)
         {
              bars = g.append("g")
                      .attr("class", "bar")
                      .attr('name',function() {return d.properties.NOM_DEPT;})
                      .attr("transform", function() {
                                                  total = 0;
                                                  var initial_array=d.properties.superficie_vigne.bar;
                                                       for (var i=0; i<initial_array.length; i++) {
                                                                for(key in initial_array[i])
                                                                {
                                                                  total = total + initial_array[i][key];
                                                                } 
                                                            }
                                                  var rng=Math.sqrt(total)/5                                                       
                        //return "translate(" + (map_path.centroid(d)[0]-rng/6) + "," +  (map_path.centroid(d)[1]-rng/2) + ")" // to center
                        return "translate(" + (map_path.centroid(d)[0]-rng*1.05) + "," +  (map_path.centroid(d)[1]-rng/2) + ")" //to put left
                      })
                      .on("click",clicked)
                  

              var pd=d


              bar = bars.selectAll("rect")
                        .data(function(){
                                          var temparray = [];
                                          var tempsum = 0;
                                          var initial_array=d.properties.superficie_vigne.bar
                                          initial_array.reverse();
                                             for (var i=0; i<initial_array.length; i++) {
                                                      for(key in initial_array[i])
                                                      {
                                                        tempsum = tempsum + initial_array[i][key];
                                                        //temparray.push({y0:tempsum-initial_array[i][key],color:key});
                                                        temparray.push({y0:tempsum,color:key,area:initial_array[i][key]});
                                                      } 
                                                  }
                                                  return temparray.reverse();}) //
                        .enter().append("rect")
                        .attr("width", function() {var rng=Math.sqrt(total)/5
                                                   return rng/3 })
                        .attr("height", function() {
                                                    var dom=total
                                                    var rng=Math.sqrt(dom)/5
                                                    var ret = d3.select(this).data()[0].y0
                                                    var y = d3.scaleLinear()
                                                              .domain([0,dom])
                                                              .range([0,rng]);
                                                    //console.log({'cumulative_prod':ret,'scale':rng,'total':dom,'scaled_val':y(ret)});
                                                    return y(ret);})
                        .style('fill',function(d){return color_map[d.color]})
                        .style("fill-opacity", 0)
                        .on("mouseover",function(d){
                                div.transition()        
                                    .duration(200)
                                    .style("opacity", .9);      
                                div.html(function() {
                                  return ""+pd.properties.NOM_DEPT+"<br>"+ legend_map[d.color] + "<br><br>" + "Area : "+ d.area + " ha "+" ("+Math.round(10000*d.area/total)/100+"%)"})  
                                    .style("left", (d3.event.pageX + 10) + "px")     
                                    .style("top", (d3.event.pageY - 10) + "px")})
                        .on("mouseout", function(d) {
                              div.transition()
                              .duration(0)
                                  .style("opacity", 0);
                              div.html("")
                                  .style("left", "0px")
                                  .style("top", "0px");
                                })
                        .transition()
                        .duration(1000)
                        .style("fill-opacity", 1)

      }});
    }