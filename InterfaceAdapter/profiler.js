"use strict";
//let logger = require('../messages');

/** Конструктор Profiler для тестирования времени исполнения кода
 *
 * @param label (string) - название профайлера, используется для лога
 */
function Profiler(label) {
    this.label = label;
    this.timeStart = null;
    this.timeEnd = null;
}

/** Начало отсчета времени*/
Profiler.prototype.start = function () {
    this.timeStart = process.hrtime();
};

/** Конец отсчета времени, выводит время в лог только если время исполнения больше 1 секунды
 *
 * @param {string=} text - для отдельного вывода в лог (необязательно)
 */
Profiler.prototype.end = function (text) {
    const nsTOms = 1000000;
    this.timeEnd = process.hrtime(this.timeStart);
    let seconds = parseInt(this.timeEnd[0]);
    let ms = parseInt(this.timeEnd[1]) / nsTOms;
    // if (seconds < 1) {
    //     return;
    // }
    if (typeof text !== 'undefined') {
        console.log(text);
    }
    console.log(this.label + ' time:', seconds + 's ' + ms + ' ms');
};

module.exports = Profiler;