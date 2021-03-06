angular.module('MyApp')
  .controller('tripsearchCtrl', function($scope, $rootScope, $location, $window, $auth, $timeout, tripprice, uiGmapGoogleMapApi, singlestationprice, averagepricepredict) {
    $rootScope.siteTitle = 'Trip Search';

    $scope.options = {
        componentRestrictions: { country: 'AU' }
    };

    // instantiate google map objects for directions
    var directionsDisplay = new google.maps.DirectionsRenderer();
    var directionsService = new google.maps.DirectionsService();
    var geocoder = new google.maps.Geocoder();
    // directions object -- with defaults
    $scope.directions = {
      origin: $scope.address,
      destination: $scope.address,
      showList: false
    }
    //$scope.googleMapsUrl="https://maps.googleapis.com/maps/api/js?key=AIzaSyB_hWH944ixwXX1x3KXIAXynY99IDfR2FQ";
    $scope.advanced = false;
    $scope.searched = false;
    $scope.mapCenter = {};
    $scope.stations = {};
    $scope.brand = "fuel-guru.png"
    $scope.map = { center: { latitude: 45, longitude: -73 }, zoom: 8, control: {}};
    $scope.getPricesTrip = function(){
        console.log("called")
        console.log("latitude is", $scope.address.components.location.lat)
        console.log("longitude is", $scope.address.components.location.long)
        console.log("latitude1 is", $scope.address1.components.location.lat)
        console.log("longitude1 is", $scope.address1.components.location.long)
        // coords = getMidPointFromLatLon($scope.address.components.location.lat,
        //                                $scope.address.components.location.long,
        //                                $scope.address1.components.location.lat,
        //                                $scope.address1.components.location.long)

        coordinates = {
            // lat : coords[0],
            // lon : coords[1],
            lat  : $scope.address.components.location.lat,
            lon  : $scope.address.components.location.long,
            lat1 : $scope.address1.components.location.lat,
            lon1 : $scope.address1.components.location.long,
        }
        tripprice.send(coordinates)
            .then(function(response) {
                console.log("RESPONSE: ", response.data)
                $scope.stations = response.data

                //filter stations by fuel type if selected
                if ($scope.octane != "") {
                  $scope.stations = $scope.stations.filter(function(element) {
                    return getFuelTypeInPrice(element.prices, $scope.octane)
                  })
                }

                $scope.stations.forEach(function(element) {
                    console.log(element)
                    //map center hash
                    element.prices = filterPrices(element.prices)
                    $scope.mapCenter[element.stationcode] = element.location;
                    distance = getDistanceFromLatLonInKm($scope.address.components.location.lat,
                                                         $scope.address.components.location.long,
                                                         element.location.latitude,
                                                         element.location.longitude)

                    element.distance = Math.round(distance * 100) / 100
                    element.showMap = false;
                    extra_time = getExtraTravelTime($scope.address.components.location.lat,
                                                                 $scope.address.components.location.long,
                                                                 element.location.latitude,
                                                                 element.location.longitude,
                                                                 $scope.address1.components.location.lat,
                                                                 $scope.address1.components.location.long
                                                                 );
                    if (extra_time == 1) {
                      extra_time += " min"
                    } else {
                      extra_time += " mins"
                    }
                    element.extraTravelTime = extra_time
                    console.log(element.extraTravelTime)
                    switch(element.brand){
                        case "Caltex":
                            $scope.brand = "caltex.jpg"
                            element.pic = "caltex.jpg"
                            break;
                        case "Caltex Woolworths":
                            if($scope.woolworths == true){
                                element.prices.forEach(function(entry) {
                                    console.log(entry.price);
                                    entry.price -= 4;
                                    console.log(entry.price);
                                });
                            }
                            $scope.brand = "caltex.jpg"
                            element.pic = "caltex.jpg"
                            break;
                        case "BP":
                            $scope.brand = "bp_logo.png"
                            element.pic = "bp_logo.png"
                            break;
                        case "Metro Fuel":
                            $scope.brand = "metro.jpg"
                            element.pic = "metro.jpg"
                            break;
                        case "Coles Express":
                            if($scope.coles == true){
                                element.prices.forEach(function(entry) {
                                    console.log(entry.price);
                                    entry.price -= 4;
                                    console.log(entry.price);
                                });
                            }
                            $scope.brand = "coles.png"
                            element.pic = "coles.png"
                            break;
                        case "7-Eleven":
                            $scope.brand = "7eleven.png"
                            element.pic = "7eleven.png"
                            break;
                        case "Westside":
                            $scope.brand = "westside.png"
                            element.pic = "westside.png"
                            break;
                        case "Budget":
                            $scope.brand = "budget.png"
                            element.pic = "budget.png"
                            break;
                        case "Speedway":
                            $scope.brand = "speedway.png"
                            element.pic = "speedway.png"
                            break;
                        case "United":
                            $scope.brand = "united.jpg"
                            element.pic = "united.jpg"
                            break;
                        case "Tesla":
                            $scope.brand = "tesla.png"
                            element.pic = "tesla.png"
                            break;
                        default:
                            $scope.brand = "fuel-guru.png"
                            element.pic = "fuel-guru.png"


                    }
                    if ($scope.octane != "") {
                      element.cheapesttype = $scope.octane;
                      element.cheapestprice = getPriceFromFuelType(element.prices, $scope.octane)
                      element.averageprice = element.cheapestprice
                    } else {
                      var sum = 0;
                      var numelems = 0;
                      var cheapest = 9999;
                      var cheapesttype = "";
                      for(i = 0; i < element.prices.length; i ++){
                          if(element.prices[i].fueltype != "LPG"){
                              sum += element.prices[i].price;
                              numelems ++;
                              if(element.prices[i].price < cheapest){
                                  cheapest = element.prices[i].price;
                                  cheapesttype = element.prices[i].fueltype;
                              }
                          }
                      }
                      var avg = sum/numelems;
                      avg = Math.round(avg * 100) / 100
                      element.averageprice = avg;
                      element.cheapestprice = cheapest;
                      element.cheapesttype = cheapesttype;

                    }
                }, this);
                $scope.searched = true;
                $scope.sortByKey($scope.stations, 'cheapestprice')
                componentHandler.upgradeDom();
            })
            .catch(function(response) {
                console.log("some sort of error")
            });
    }


    $scope.sortByKey = function(array, key) {
        clearDiv()
        clearChart()
        return array.sort(function(a, b) {
            var x = a[key]; var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

    $scope.sortByKeyRev = function(array, key) {
        clearDiv()
        clearChart()
        return array.sort(function(a, b) {
            var x = a[key]; var y = b[key];
            return ((x < y) ? 1 : ((x > y) ? -1 : 0));
        });
    }

    filterPrices = function(array) {
      var retarray = new Array()
      array.forEach(function(element) {
        if (element.fueltype == "E10" || element.fueltype == "PDL" || element.fueltype == "P95" || element.fueltype == "P98" || element.fueltype == "U91") {
          retarray.push(element)
        }
      })
      return retarray
    }

    clearDiv = function() {
      for (i=0; i < $scope.hiddenDiv.length; i++) {
        $scope.hiddenDiv[i] = false
      }
      $scope.directions.showList = false;
    }

    clearChart = function() {
      for (i=0; i < $scope.hiddenChart.length; i++) {
        $scope.hiddenChart[i] = false
      }
    }

      $scope.sendContactForm= function(){
          $scope.buttonClicked = true;
          console.log("send the contact form");
      }

      getPriceFromFuelType = function(prices, fueltype) {
        for(i = 0; i < prices.length; i ++){
            if(prices[i].fueltype == fueltype){
                return prices[i].price
            }
        }
        return "Not available."
      }

      getFuelTypeInPrice = function(prices, fueltype) {
        for(i = 0; i < prices.length; i ++){
            if(prices[i].fueltype == fueltype){
                return true
            }
        }
        return false
      }

      getMidPointFromLatLon = function(lat1, lon1, lat2, lon2) {
          var lat = (lat1+lat2)/2;
          var lon = (lon1+lon2)/2;
          return [lat, lon];
      }


      getDistanceFromLatLonInKm = function (lat1,lon1,lat2,lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1);
        var a =
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
          Math.sin(dLon/2) * Math.sin(dLon/2)
          ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d;
      }

      deg2rad = function(deg) {
        return deg * (Math.PI/180)
      }

      $scope.hiddenDiv=[];
      $scope.showDiv = function (index, station) {
          $scope.directions.showList = false;
          clearChart()
          for (i=0; i < $scope.hiddenDiv.length; i++) {
            if (i != index) {
              $scope.hiddenDiv[i] = false
            }
          }
          $scope.hiddenDiv[index] = !$scope.hiddenDiv[index];

          $scope.station_markers = [];

          // $scope.stations.forEach(function(element) {
          //   $scope.station_markers.push({
          //       'id': element.stationcode,
          //       'latitude': element.location.latitude,
          //       'longitude': element.location.longitude,
          //       'options' : {icon:'http://maps.google.com/mapfiles/ms/icons/green-dot.png'},
          //   });
          // });

          $scope.station_markers.push({
              'id': $scope.address.components.location.lat,
              'latitude': $scope.address.components.location.lat,
              'longitude': $scope.address.components.location.long,
              'options' : {icon:'http://maps.google.com/mapfiles/ms/icons/green-dot.png'},
          });
          $scope.station_markers.push({
              'id': station.stationcode,
              'latitude': station.location.latitude,
              'longitude': station.location.longitude,
          });
      };

      getExtraTravelTime = function (start_lat, start_lon, station_lat, station_lon, end_lat, end_lon) {
      //   var request1 = {
      //     origin: new google.maps.LatLng(start_lat, start_lon),
      //     destination: new google.maps.LatLng(station_lat, station_lon),
      //     travelMode: google.maps.DirectionsTravelMode.DRIVING
      //   };
      //   var request2 = {
      //     origin: new google.maps.LatLng(station_lat, station_lon),
      //     destination: new google.maps.LatLng(end_lat, end_lon),
      //     travelMode: google.maps.DirectionsTravelMode.DRIVING
      //   };
        var extrakm = getDistanceFromLatLonInKm(start_lat, start_lon, station_lat, station_lon) + getDistanceFromLatLonInKm(station_lat, station_lon, end_lat, end_lon) - getDistanceFromLatLonInKm(start_lat, start_lon, end_lat, end_lon)
        return Math.round(extrakm/0.25)
      }

      getTravelTime = function(request) {
        directionsService.route(request, function (response, status) {
          console.log('request from:', request.origin.lat, request.origin.lng, 'to: ', request.destination.lat, request.destination.lng)
          console.log(response)
          if (status === google.maps.DirectionsStatus.OK) {
            return response.routes[0].legs[0].duration.value
          } else {
            console.log('Google route unsuccesful!');
            return 0
          }
        })
      }


      // get directions using google maps api
      $scope.getDirections = function (station) {
        $scope.station_markers = [];

        //$scope.destination = station.address;
        var request = {
          origin: $scope.directions.origin,
          destination: $scope.directions.destination,
          travelMode: google.maps.DirectionsTravelMode.DRIVING
        };
        console.log("getting route")
        directionsService.route(request, function (response, status) {
          if (status === google.maps.DirectionsStatus.OK) {
            console.log(response)
            uiGmapGoogleMapApi.then(function() {
              directionsDisplay.setDirections(response);
              directionsDisplay.setMap($scope.map.control.getGMap());
              console.log($scope.map.control.getGMap())
              directionsDisplay.setPanel(document.getElementById('directionsList'));
              $scope.directions.showList = true;
            });

          } else {
            alert('Google route unsuccesful!');
          }
        });
        componentHandler.upgradeDom();

      }

      $scope.showAdvanced = function () {
        $scope.advanced = !$scope.advanced;
      };

    $scope.hiddenChart=[];
    $scope.showChart = function(index, station){
        clearDiv()
        $scope.data = [[],[]];
        $scope.labels =[];
        for (i=0; i < $scope.hiddenChart.length; i++) {
          if (i != index) {
            $scope.hiddenChart[i] = false
          }
        }
        $scope.hiddenChart[index] = !$scope.hiddenChart[index];
        console.log(station);
        var numelems = {
            numdays : 25,
            stationcode: station.stationcode,
            fueltype: station.cheapesttype
        }
		singlestationprice.send(numelems).then(function(response) {
			$scope.averageprice = response.data;
			var i = 0;
            var dt = new Date();
            console.log("single station price loop")
            console.log(response)
			$scope.averageprice.forEach(function(element) {
				$scope.data[0][i] = element.price;
				$scope.data[1][i] = null;
				dt = new Date(element.createdAt);
				var str = (dt.getMonth() + 1) + "/" + dt.getDate();
				$scope.labels[i] = str;
				i ++;
            })
            dt = new Date();
            var str = (dt.getMonth() + 1) + "/" + dt.getDate();
            $scope.labels[i-1] = str;
			//set the overlap so it is right
			$scope.data[1][i-1] = $scope.data[0][i-1]
			//initiate the predict elems
			var predictelems={
				prevprevprice : $scope.data[0][i-2],
				prevprice : $scope.data[0][i-1],
				cycle_day: 3,
				brand : station.brand,
				fueltype: station.cheapesttype
			}

			var predictor = function(predictelems, predictionstogo){
				averagepricepredict.send(predictelems).then(function(response){
					$scope.data[0][i] = null
					$scope.data[1][i] = response.data.prediction[0]
					dt.setDate(dt.getDate() + 1);
					$scope.labels[i] = (dt.getMonth() + 1) + "/" + dt.getDate();

					i ++;
					predictionstogo --;
					if(predictionstogo > 0){
						predictelems.prevprevprice = predictelems.prevprice;
						predictelems.cycle_day ++;
						predictelems.prevprice = response.data.prediction[0]
						predictor(predictelems, predictionstogo)
					}


				}).catch(function(response) {
					console.log("error in fetching the average prices")
				});
			}
			predictor(predictelems, 3);


  		}).catch(function(response) {
  			console.log("error in fetching the average prices")
  		});

      }


      //chart stuff

      $scope.data = [[],[]];
      $scope.labels =[];


      $scope.colors = [
        {
          backgroundColor: "rgba(159,204,0, 0.2)",
          pointBackgroundColor: "rgba(159,204,0, 1)",
          pointHoverBackgroundColor: "rgba(159,204,0, 0.8)",
          borderColor: "rgba(159,204,0, 1)",
          pointBorderColor: '#fff',
          pointHoverBorderColor: "rgba(159,204,0, 1)"
        },
        {
            backgroundColor: "rgba(30,0,290, 0.2)",
            pointBackgroundColor: "rgba(30,0,290, 1)",
            pointHoverBackgroundColor: "rgba(30,0,290, 0.8)",
            borderColor: "rgba(30,0,290, 1)",
            pointBorderColor: '#fff',
            pointHoverBorderColor: "rgba(30,0,290, 1)"
        }
      ];
      $scope.onClick = function (points, evt) {
        console.log(points, evt);
    };
    $scope.coptions = {
        scales: {
            yAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Price'
              }
            }],
            xAxes: [{
              scaleLabel: {
                display: true,
                labelString: 'Day'
              }
            }]
          }
    };








  });
