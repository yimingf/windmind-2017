// Dinner controller that we use whenever we have view that needs to
// display or modify the dinner menu
dashboardApp.controller('DashboardCtrl', function ($scope, Data) {

    $scope.dataService = Data;

    $scope.nameOfWindfarm = "wp1";
    $scope.currentYear = 2012;
    $scope.currentMonth = 6;
    $scope.currentDate = 26;

    $scope.nameOfWindfarms = ["wp1", "wp2", "wp3"];
    $scope.farmsFullCapacity = {"wp1": 110, "wp2": 48, "wp3": 11};
    $scope.yearsMontlyProductionArray = undefined;
    $scope.yearsMontlyProductionMonthNamesArray = undefined;
    $scope.averageMonthlyProduction = undefined;
    $scope.yearsPercentOfFullCapacity = undefined;
    $scope.apiCallStatus = undefined;
    $scope.dailyProduction = undefined;
    $scope.monthlyProduction = undefined;
    $scope.lastYearsPercentOfFullCapacity = undefined;
    $scope.dailyWindForecastData = undefined;
    $scope.dailyProductionDataMap = {};

    $scope.requestsToWaitFor = 4;

    //Make all calls to api to retrieve data
    $scope.buildDataFromApi = function () {
        $scope.apiCallStatus = "Loading...";
        $scope.resultCounter = 0;

        var promiseDailyData = $scope.dataService.getBenchmarkDataGroupedByDate();
        promiseDailyData.then(
            function (response) {
                $scope.resultCounter++;
                //console.log("Retrieved daily: "+JSON.stringify(response.data));
                $scope.dailyProduction = response.data;
                if($scope.resultCounter == $scope.requestsToWaitFor){
                    $scope.buildDataFromResults();
                }
            },
            function (response) {
                $scope.dailyProduction = undefined;
                $scope.apiCallStatus = "Error :(";
                alert("Error: " + JSON.stringify(response));
            }
        );

        var promiseMonthlyData = $scope.dataService.getBenchmarkDataGroupedByMonth();
        promiseMonthlyData.then(
            function (response) {
                $scope.resultCounter++;

                //console.log("Retrieved montly: "+JSON.stringify(response.data));
                $scope.monthlyProduction = response.data;
                if($scope.resultCounter == $scope.requestsToWaitFor){
                    $scope.buildDataFromResults();
                }
            },
            function (response) {
                $scope.monthlyProduction = undefined;
                $scope.apiCallStatus = "Error :(";
                alert("Error: " + JSON.stringify(response));
            }
        );

        var promiseYearlyData = $scope.dataService.getBenchmarkDataGroupedByYear();
        promiseYearlyData.then(
            function (response) {
                $scope.resultCounter++;

                //console.log("Retrieved yearly: "+JSON.stringify(response.data));
                $scope.yearlyProduction = response.data;
                if($scope.resultCounter == $scope.requestsToWaitFor){
                    $scope.buildDataFromResults();
                }
            },
            function (response) {
                $scope.yearlyProduction = undefined;
                $scope.apiCallStatus = "Error :(";
                alert("Error: " + JSON.stringify(response));
            }
        );

        var promiseDailyWindData = $scope.dataService.getDailyWindspeedData($scope.nameOfWindfarm.substring(2));
        promiseDailyWindData.then(
            function (response) {
                $scope.resultCounter++;
                console.log("Retrieved daily wind data: "+JSON.stringify(response.data));
                $scope.dailyWindForecastData = {};
                $scope.dailyWindForecastData[$scope.currentYear] = {};
                $scope.dailyWindForecastData[$scope.currentYear - 1] = {};

                angular.forEach(response.data, function(value, key) {
                    if(value.year == $scope.currentYear || value.year == $scope.currentYear - 1) {
                        if($scope.dailyWindForecastData[value.year][value.month] === undefined){
                            $scope.dailyWindForecastData[value.year][value.month] = {};
                        }

                        $scope.dailyWindForecastData[value.year][value.month][value.date] = {
                            "ws": value.ws,
                            "wd": value.wd
                        };
                    }
                });

                console.log("Wind array: "+JSON.stringify($scope.dailyWindForecastData));

                if($scope.resultCounter == $scope.requestsToWaitFor){
                    $scope.buildDataFromResults();
                }
            },
            function (response) {
                $scope.dailyWindForecastData = undefined;
                $scope.apiCallStatus = "Error :(";
                alert("Error: " + JSON.stringify(response));
            }
        );
    };



    $scope.buildDataFromResults = function(){

        if(!$scope.validateWindfarmName($scope.nameOfWindfarm)){
            alert("Invalid wind farm name: "+nameOfWindfarm);
            return;
        }

        $scope.apiCallStatus = undefined;
        console.log("Should build data from results...");

        //Build stuff from daily data
        //Loop through every day
        angular.forEach($scope.dailyProduction, function(monthlyData, year) {
            var yearDailyCumulativeProductionDateArray = [];
            var yearDailyCumulativeProductionArray = [];
            var yearsCululativeValue = 0;

            var yearDailyProductionDateArray = [];
            var yearDailyWindArray = [];
            var yearDailyProductionArray = [];
            var yearDailyProductionAndWindVectors = [];

            //Loop through all months
            angular.forEach(monthlyData, function(dailyValues, month) {
                //Loop through all days
                angular.forEach(dailyValues, function(dailyValue, date) {
                    console.log("DailyValue: "+JSON.stringify(dailyValue));
                    yearsCululativeValue += dailyValue["SUM "+$scope.nameOfWindfarm];
                    yearDailyCumulativeProductionArray.push(yearsCululativeValue);
                    //yearDailyCumulativeProductionDateArray.push(year + "-" + month + "-" + date);
                    yearDailyCumulativeProductionDateArray.push(date + " " + $scope.dataService.getMonthNameByNumber(month));
                    yearDailyProductionDateArray.push(year+"-"+month+"-"+date);
                    yearDailyProductionArray.push(dailyValue["SUM "+$scope.nameOfWindfarm]);
                    yearDailyWindArray.push($scope.dailyWindForecastData[year][month][date]["ws"])

                });
            });

            $scope.dailyProductionDataMap[year] = {
                datesCumulative: yearDailyCumulativeProductionDateArray,
                valuesCumulative: yearDailyCumulativeProductionArray,
                datesDailyProduction: yearDailyProductionDateArray,
                valuesDailyProduction: yearDailyProductionArray,
                valuesDailyWindSpeed: yearDailyWindArray
            };
            console.log("dailyProductionDataMap: "+JSON.stringify($scope.dailyProductionDataMap));
        });

        //Build stuff from monthly data
        $scope.yearsMontlyProductionMonthNamesArray = [];
        $scope.yearsMontlyProductionArray = [];
        //For every month try to build the month
        for(var monthNumber=1; monthNumber<=$scope.currentMonth; monthNumber++) {
            if($scope.monthlyProduction[$scope.currentYear] !== undefined){
                $scope.yearsMontlyProductionMonthNamesArray.push($scope.dataService.getMonthNameByNumber(monthNumber));
                $scope.yearsMontlyProductionArray.push($scope.monthlyProduction[$scope.currentYear][monthNumber]["SUM "+$scope.nameOfWindfarm]);
            }
        }

        //Build stuff from yearly data
        $scope.yearsTotalProduction = $scope.yearlyProduction[$scope.currentYear]["SUM "+$scope.nameOfWindfarm];
        //Percent of capacity
        var numberOfDaysSinceStartOfTheYear = $scope.dataService.countNumberOfDaysSinceStartOfTheYear(
            $scope.currentYear, $scope.currentMonth, $scope.currentDate);
        var fullCapacity = numberOfDaysSinceStartOfTheYear * 24 * $scope.farmsFullCapacity[$scope.nameOfWindfarm];
        $scope.yearsPercentOfFullCapacity = $scope.yearsTotalProduction / fullCapacity * 100;

        //Last years data
        $scope.lastYearsTotalProduction = undefined;
        if($scope.yearlyProduction[$scope.currentYear - 1] !== undefined){
            $scope.lastYearsTotalProduction = $scope.yearlyProduction[$scope.currentYear - 1]["SUM "+$scope.nameOfWindfarm];
            $scope.lastYearsPercentOfFullCapacity = $scope.lastYearsTotalProduction / (365 * 24 * $scope.farmsFullCapacity[$scope.nameOfWindfarm]) * 100;
        }


        //Build grapsh
        $scope.buildAllGraphs();
    };

    $scope.buildAllGraphs = function(){
        $scope.buildMonthlyProductionChart();
        $scope.buildCumulativeProductionChart();
        $scope.buildPowerCurveChart();
        $scope.buildWindProductionChart();
    };

    $scope.buildWindProductionChart = function () {
        var dateArray = $scope.dailyProductionDataMap[$scope.currentYear].datesDailyProduction;
        var dailyPowerArray = $scope.dailyProductionDataMap[$scope.currentYear].valuesDailyProduction;
        var dailyWindSpeedArray = $scope.dailyProductionDataMap[$scope.currentYear].valuesDailyWindSpeed;

        console.log(JSON.stringify(dateArray));
        console.log(JSON.stringify(dailyPowerArray));
        console.log(JSON.stringify(dailyWindSpeedArray));

        var trace1 = {
            x: dateArray,
            y: dailyWindSpeedArray,
            type: 'scatter',
            name: 'windspeed data',
            line: { // set the width of the line.
                width: 2
            },
            yaxis: 'y2',
        };

        var trace2 = {
            x: dateArray,
            y: dailyPowerArray,
            type: 'bar',
            name: 'production data',
        };

        var layout = {
            title: '',
            yaxis: {title: 'MW/h'},
            yaxis2: {
                title: 'm/s',
                titlefont: {color: 'rgb(148, 103, 189)'},
                tickfont: {color: 'rgb(148, 103, 189)'},
                overlaying: 'y',
                side: 'right'
            }
        };

        var data = [trace1, trace2];
        Plotly.newPlot('wind-production-chart', data, layout);
    };

    $scope.buildPowerCurveChart = function () {

        var dailyPowerArray = $scope.dailyProductionDataMap[$scope.currentYear].valuesDailyProduction;
        var dailyWindSpeedArray = $scope.dailyProductionDataMap[$scope.currentYear].valuesDailyWindSpeed;

        trace1 = {
            x: dailyWindSpeedArray,
            y: dailyPowerArray,
            marker: {color: 'rgb(21, 83, 125)'},
            mode: 'markers',
            name: 'Power Output (W)',
            type: 'scatter',
            uid: '095034'
        };
        trace2 = {
            x: [0, 0.5, 1, 1.5, 2,
                2.5, 3, 3.5, 4, 4.5,
                5, 5.5, 6, 6.5, 7,
                7.5],
            y: [0, 0, 0, 0, 70,
                100, 250, 400, 500, 650,
                800, 1000, 1200, 1400, 1700,
                2000],
            connectgaps: false,
            line: {
                color: 'rgb(58, 211, 164)',
                width: 4
            },
            name: 'Power Output (W) - fit',
            opacity: 0.5,
            type: 'scatter',
            uid: '8e7154',
            xaxis: 'x',
            yaxis: 'y'
        };
        data = [trace1, trace2];
        layout = {
            autosize: true,
            showlegend: false,
            title: 'D400 Power Curve',
            xaxis: {
                autorange: true,
                range: [1.26701153999, 14.73298846],
                title: 'Wind Speed (m/s)',
                type: 'linear'
            },
            yaxis: {
                autorange: true,
                range: [-65.7530924456, 991.790117646],
                title: 'Power Output (W)',
                type: 'linear'
            }
        };
        Plotly.plot('power-curve-chart', {
            data: data,
            layout: layout
        });
    };

    $scope.buildCumulativeProductionChart = function () {
        var dateArray = $scope.dailyProductionDataMap[$scope.currentYear].datesCumulative;
        var cumulativeProductionArray = $scope.dailyProductionDataMap[$scope.currentYear].valuesCumulative;
        var dateArray2 = $scope.dailyProductionDataMap[$scope.currentYear - 1].datesCumulative;
        var cumulativeProductionArray2 = $scope.dailyProductionDataMap[$scope.currentYear - 1].valuesCumulative;

        var trace1 = {
            x: dateArray,
            y: cumulativeProductionArray,
            type: 'scatter',
            name: $scope.currentYear,
            line: { // set the width of the line.
                width: 3
            }
        };

        var trace2 = {
            x: dateArray2,
            y: cumulativeProductionArray2,
            type: 'scatter',
            name: $scope.currentYear - 1,
            line: { // set the width of the line.
                width: 3
            }
        };

        var layoutProd2 = {
            title: '',
            yaxis: {title: 'MW/h'},
            hovermode:'closest'
        };

        var data = [trace1, trace2];

        Plotly.newPlot('cumulative-production-chart', data, layoutProd2);
    };

    $scope.buildMonthlyProductionChart = function () {

        var trace1Prod = {
            x: $scope.yearsMontlyProductionMonthNamesArray,
            y: $scope.yearsMontlyProductionArray,
            type: 'bar',
            name: 'windspeed data',
            line: { // set the width of the line.
                width: 3
            },
            mode:'markers',
            marker:{size:16}
        };

        var layoutProd = {
            title: '',
            yaxis: {title: 'MW/h'},
            hovermode:'closest'
        };

        var dataProd = [trace1Prod];

        var myPlot = document.getElementById('yearly-production-chart');
        Plotly.newPlot('yearly-production-chart', dataProd, layoutProd);

        myPlot.on('plotly_click', function(data){
            var pts = '';
            for(var i=0; i < data.points.length; i++){
                pts = 'x = '+data.points[i].x +'\ny = '+
                    data.points[i].y.toPrecision(4) + '\n\n';
            }
            alert('Closest point clicked:\n\n'+pts);
        });
    };

    $scope.validateWindfarmName = function (nameOfWindfarm) {
        if($scope.nameOfWindfarms.indexOf(nameOfWindfarm) === -1){
            return false;
        }
        return true;
    };

    $scope.buildDataFromApi(2012, "wp2");
    /*$scope.buildMonthlyProductionChart(2012, "wp2");
    $scope.buildKeyMetricsView(2012, "wp2");*/

});