// ==UserScript==
// @name         SteamCompanion Auto Giveaway Enterer
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  A script that automatically enters all available giveaways on SteamCompanion.com
// @author       Humberd
// @match        https://steamcompanion.com/*
// ==/UserScript==

(function () {
    'use strict';

    var barSelector = ".top-bar-section ul.left";
    var bar = $(barSelector);
    bar.append("<li><button id='enterer-button'>Enter All Giveaways</buton></li>");
    var successNumber = "<span id='success-number'>0</span>";
    var successPoints = "<span id='success-points'>0</span>";
    var successWrapper = "<span id='success-wrapper'>" + successNumber + " (" + successPoints + "p)" + "</span>";
    var errorNumber = "<span id='error-number'>0</span>";
    var totalNumber = "<span id='total-number'>0</span>";
    bar.append("<li><a>" + successWrapper + " / " + errorNumber + " / " + totalNumber + "</a></li>");

    var button = $("#enterer-button");
    button.click(enterAllGiveaways);

    var successNumberPointer = $("#success-number");
    var successPointsPointer = $("#success-points");
    var successWrapperPointer = $("#success-wrapper");
    successWrapperPointer.css("color", "green");

    var errorNumberPointer = $("#error-number");
    errorNumberPointer.css("color", "red");

    var totalNumberPointer = $("#total-number");
    totalNumberPointer.css("color", "black");

    function enterAllGiveaways() {
        handler.clear();
        getGiveawaysListPage(1);
        // sendEnterRequest("aq4p");
    }

    function continueSending(numberOfPages) {
        for (var i = 2; i <= numberOfPages; i++) {
            getGiveawaysListPage(i);
        }
    }

    function getGiveawaysListPage(nr) {
        $.ajax({
            url: "https://steamcompanion.com/gifts/index.php?page=" + nr,
            method: "GET",
            xhrFields: {
                withCredentials: true
            },
            dataType: "html",
            success: function (data) {
                var htmlPage = $.parseHTML(data);
                var giveawayList = $(htmlPage).find(".giveaway-links .game-name a");
                for (var i = 0; i < giveawayList.length; i++) {
                    var link = (giveawayList[i].href).split("/");
                    // visitPage(link[4]);
                    sendEnterRequest(link[4]);
                }
                if (nr === 1) {
                    var lastPageNumberElement = $(htmlPage).find(".pagination li").last().find("a");
                    var lastPageLink = (lastPageNumberElement[0].href).split("=");
                    continueSending(lastPageLink[1]);
                }
            }
        });
    }

    function visitPage(id) {
        $.ajax({
            url: "https://steamcompanion.com/gifts/" + id + "/",
            method: "GET",
            xhrFields: {
                withCredentials: true
            },
        });
    }

    function RequestHandler() {
        var success = 0;
        var successPoints = 0;
        var error = 0;
        var total = 0;

        this.registerRequest = function () {
            total++;
            this.refreshTotal();
        };
        this.callError = function () {
            error++;
            this.refreshError();
        };
        this.callSuccess = function (points) {
            success++;
            successPoints += points;
            this.refreshSuccess();
            this.refreshSuccessPoints();
        };
        this.refreshTotal = function () {
            totalNumberPointer.text(total);
        };
        this.refreshError = function () {
            errorNumberPointer.text(error);
        };
        this.refreshSuccess = function () {
            successNumberPointer.text(success);
        };
        this.refreshSuccessPoints = function () {
            successPointsPointer.text(successPoints);
        };
        this.refreshAll = function () {
            this.refreshSuccess();
            this.refreshSuccessPoints();
            this.refreshError();
            this.refreshTotal();
        };
        this.clear = function () {
            success = 0;
            successPoints = 0;
            error = 0;
            total = 0;
            this.refreshAll();
        };
    }
    var handler = new RequestHandler();

    function sendEnterRequest(id) {
        $.ajax({
            url: "https://steamcompanion.com/gifts/steamcompanion.php",
            method: "POST",
            xhrFields: {
                withCredentials: true
            },
            data: {
                script: "enter",
                hashID: id,
                token: "",
                action: "enter_giveaway"
            },
            headers: {
                Accept: "application/json, text/javascript, */*; q=0.01"
            },
            beforeSend: function () {
                handler.registerRequest();
            },
            success: function (data, textStatus) {
                data = JSON.parse(data);
                if (data[0] === "Success") {
                    handler.callSuccess(Math.abs(data.minus));
                } else {
                    handler.callError();
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                handler.callError();
            }
        });
    }
})();