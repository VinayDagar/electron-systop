const { ipcRenderer } = require("electron");
const { cpu, mem, os } = require('node-os-utils');
const { Notification } = require('electron').remote;
const moment = require("moment");

let cpuOverLoad;
let alertFrequency;

ipcRenderer.on("settings:get", (e, values) => {
    cpuOverLoad = +values.cpuOverload;
    alertFrequency = +values.alertFrequency;
});

function showAlertNotification(usage) {
    new Notification({
        title: "CPU Overload",
        body: "The CPU usage has over the limit " + usage
    }).show();
}

async function setStaticContent() {
    document.getElementById('cpu-model').innerText = cpu.model();
    document.getElementById('comp-name').innerText = os.hostname();
    document.getElementById('os').innerText = `${os.type()} ${os.arch()}`;
    document.getElementById('os').innerText = `${os.type()} ${os.arch()}`;

    const info = await mem.info();
    document.getElementById('mem-total').innerText = info.totalMemMb;

}

function convertSecondsToTime(seconds) {
    seconds = +seconds;

    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % (3600)) / 60);
    const s = Math.floor(seconds % 60);

    return `${d}d, ${h}h, ${m}m, ${s}s`;
}

async function setDynamicContent() {
    const cpuInfo = await cpu.usage();
    document.getElementById('cpu-usage').innerText = `${cpuInfo}%`;

    document.getElementById('cpu-progress').style.width = `${cpuInfo}%`;

    if (cpuInfo > cpuOverLoad) {
        document.getElementById('cpu-progress').style.background = 'red';
        checkLastAlertAndShowNotification(cpuInfo);
    } else {
        document.getElementById('cpu-progress').style.background = '#30c88b';
    }

    const cpuFree = await cpu.free();
    document.getElementById('cpu-free').innerText = `${cpuFree}%`;

    document.getElementById('sys-uptime').innerText = convertSecondsToTime(os.uptime());

}

const checkLastAlertAndShowNotification = (info) => {
    let lastAlert = localStorage.getItem("last_alert");

    if (lastAlert) {
        const current = moment();
        const alert = moment(lastAlert);

        const difference = current.diff(alert, "minutes");
        
        if (difference >= alertFrequency) {
            showAlertNotification(info);
            localStorage.setItem("last_alert", moment());
        }
    } else {
        localStorage.setItem("last_alert", moment());
        showAlertNotification(info);
    }

};

setStaticContent();
setInterval(() => {
    setDynamicContent();
}, 1000);
