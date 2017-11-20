var TelegramBot = require('node-telegram-bot-api');
var token = '491048299:AAH5owYfunofcbV-j2qlh9-IspOlTj5pnMk';
var bot = new TelegramBot(token, {polling: true});
var apiai = require('apiai');
var app = apiai("f14082e14ebb4894b5c9ead932fd3f07");
var fs = require('fs');

function normalizeday(date1) {
    if (date1.getDay() === 6) {
        date1.setDate(date1.getDate() - 1);
        return date1;
    } else if (date1.getDay() === 0) {
        date1.setDate(date1.getDate() - 2);
        return date1;
    } else {
        return date1;
    }

}

function zpdate(nmonth, monthquery) {
    var resdate = new Date(2017, nmonth, 5);
    resdate = normalizeday(resdate);
    var now = new Date();
    var currdate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (currdate > resdate) {
        resdate.setDate(20);
        resdate = normalizeday(resdate);
            if (currdate > resdate) {
                if (monthquery === false) {
                    return zpdate(nmonth+1, true);
                } else {
                    resdate.setFullYear(2018);
                    resdate.setDate(5);
                    resdate = normalizeday(resdate);
                }
            }
        }
    return resdate;
}



function dayscount(zpdate1) {
    var currdate = new Date();
    return Math.ceil((zpdate1-currdate)/(1000*3600*24));
}

function textdays(n) {
    if (n>1 && n<5) {
        return " дня.";
    } else if (n === 1){
        return " день.";
    } else {
        return " дней.";
    }
}

function createans(zpdate1) {
    if (dayscount(zpdate1) > 5) {
        var smile = '😞';
    } else {
        smile = '😎';
    }
    if (dayscount(zpdate1) === 1) {
        return "Зарплата придёт уже завтра😎";
    } else if (dayscount(zpdate1) === 2) {
        return "Зарплата придёт уже послезавтра😎";
    } else if (dayscount(zpdate1) === 0) {
        return "Сегодня😎";
    } else {
        return "Зарплата придет " + zpdate1.getDate() + '.'
            + (zpdate1.getMonth() + 1) + '.' + zpdate1.getFullYear() + ", осталось "
            + dayscount(zpdate1) + textdays(dayscount(zpdate1)) + smile;
    }
}

bot.on('message', function (msg) {
    var chatId = msg.chat.id;
    console.log(msg);
    var request = app.textRequest(msg.text, {
        sessionId: 'testbot-1661c'
    });

    request.on('response', function(response) {
        console.log(response);
        fs.appendFile("log.txt", "\nINPUTDATA: " + JSON.stringify(response));
        if (response.result['metadata']['intentName'] === "DaysCount") {
            var currmonth = (new Date()).getMonth();
            var zpdate1 = zpdate(currmonth, false);
            var ans = createans(zpdate1);
            bot.sendMessage(chatId, ans);
            fs.appendFile("log.txt", "\nOUTPUTDATA: " + ans);
        } else if (response.result['metadata']['intentName'] === "MonthQuery") {
            if (response.result['parameters']['date-period'] !== '') {
                var n = response.result['fulfillment']['speech'][5] + response.result['fulfillment']['speech'][6];
                zpdate1 = zpdate(Number(n) - 1, true);
                ans = createans(zpdate1);
                bot.sendMessage(chatId, ans);
                fs.appendFile("log.txt", "\nOUTPUTDATA: " + ans);
            } else {
                bot.sendMessage(chatId, "Упс! Кажется, у вас опечатка в запросе...");
                fs.appendFile("log.txt", "\nOUTPUTDATA: Упс! Кажется, у вас опечатка в запросе...");
            }

        } else {
            bot.sendMessage(chatId, response.result['fulfillment']['speech']);
            fs.appendFile("log.txt", "\nOUTPUTDATA: " + response.result['fulfillment']['speech']);
        }
    });

    request.on('error', function(error) {
        console.log(error);
        fs.appendFile("log.txt", "\nERROR" + JSON.stringify(error));
        bot.sendMessage(chatId, "ОШИБКА!");

    });

    request.end();

});