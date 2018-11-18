const fs = require('fs');
const process = require('child_process');

module.exports = {
    BOINC_CMD_PATH: "",

    setCliPath: function(path){
        try {
            fs.accessSync(path, fs.constants.F_OK | fs.constants.R_OK | fs.constants.X_OK);
            BOINC_CMD_PATH = path;
            return 0;
        } catch (err) {
            console.error('no access!');
            return -1;
        }
    },

    resumeTask: function (project_url, task_name) {
        try {
            process.execFileSync(BOINC_CMD_PATH, ["--task", project_url, task_name, "resume"]);
        } catch (err){
            console.error(err);
            return -1;
        }
    },

    suspendTask: function (project_url, task_name) {
        try {
            process.execFileSync(BOINC_CMD_PATH, ["--task", project_url, task_name, "suspend"]);
        } catch (err){
            console.error(err);
            return -1;
        }
    },

    suspendAllIntel: function(tasks_list){
        tasks_list.forEach(function(t){
            if(t.isIntel){
                this.suspendTask(t.project_url, t.task_name);
            }
        })
    },

    suspendAllNvidia: function(tasks_list){
        tasks_list.forEach(function(t){
            if(t.isNvidia){
                this.suspendTask(t.project_url, t.task_name);
            }
        })
    },

    enableGpu: function () {

    },

    disableGpu: function () {

    }
}
