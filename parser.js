// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const fs = require('fs');
const path = require('path');
const xmlparser = require('xml-js');
const _ = require("lodash");

const SETTINGS_FILE_PATH = "./settings.json";

let BOINC_DATA_PATH = null;

// maps app plan class to type
// see https://boinc.berkeley.edu/trac/wiki/AppPlan
const PLAN_CLASSES_NVIDIA = ["nvidia", "cuda"];
const PLAN_CLASSES_ATI = [];
const PLAN_CLASSES_INTEL = ["intel_gpu"];
const PLAN_CLASSES_VB = ["vbox"];

let plan_class_mapping = [];

// the pool of WUs (slotted or not) in the host's queue
let WU_pool = [];

/*document.addEventListener('DOMContentLoaded', function() {
    // reads settings then try to read it - on error it quits
	fs.access(SETTINGS_FILE_PATH, fs.constants.F_OK, (err) => {
	  if(err){
		  console.log("error - conf file does not exists - exiting");
	  } else {
		  fs.access(SETTINGS_FILE_PATH, fs.constants.R_OK, (err) => {
			  if(err){
				  console.log("error - conf file is not readable");
			  } else {
				  console.log("Ok - reading conf file");
				  readConfFile();
			  }
			});
	  }
	});
});*/


/*function readConfFile(){
	fs.readFile(SETTINGS_FILE_PATH, 'utf8', (err, contents) => {
	  if (err) {
		console.log("unable to read config file");
		return;
	  } else {
		  let settings = "";
		  try {
			  settings = JSON.parse(contents);
			  session_data.slots_directory = settings.boinc_data_path;
			  
			  console.log("Boinc data path is " + session_data.slots_directory);
			  
			  
		  } catch(e){
			  console.error("unable to parse conf file");
		  }
		  
		  refreshWUlist();
		  
	  }
	  
	});
}*/

module.exports = {
    refreshSlottedWUlist: function(slots_dir){
        const slots_count = getSlotsCount(slots_dir);
        let wus = [];

        console.log("there are " + slots_count + " slots available");

        // iterate over each slot directory to get wu data
        for(let i = 0; i < slots_count; i++){
            let detail_file_path = path.join(slots_dir, i.toString(), "init_data.xml");
            let meta_file_path = path.join(slots_dir, i.toString(), "boinc_task_state.xml");


            if(fs.existsSync(meta_file_path)){
                // task is running
                let raww = fs.readFileSync(detail_file_path);
                let ress = getSlottedWUresources(raww);

                let raw = fs.readFileSync(meta_file_path);
                let res = getSlottedWUmetadata(raw);

                wus.push({
                    slot: ress.slot,
                    isIntel: ress.isIntel,
                    isNvidia: ress.isNvidia,
                    project_url: res.project_url,
                    task_name: res.task_name
                })
            } else {
                console.log("skipping slot");
                continue;
            }

        }

        console.log("end refreshing wu list");
        console.dir(wus);

        return wus;
    },

    refreshWUlist: function(boinc_data_path){
        // reads all WU in the host
        let client_state_file_path = path.join(boinc_data_path, "client_state.xml");

        if(fs.existsSync(client_state_file_path)){
            // read currents state file
            let raw = fs.readFileSync(client_state_file_path);
            // parse and return useful data
            var res = getWU(raw);

            /*WU_pool.push({
                project_url: res.project_url,
                task_name: res.task_name
            })*/
        } else {
            console.log("Error reading client state file - aborting");
            return null;
        }

        // match plan to each WU
        console.dir(res);
        return res;
    }
}


function getSlotsCount(slots_dir){
	return fs.readdirSync(slots_dir).filter(f => fs.statSync(path.join(slots_dir, f)).isDirectory()).length;
}

function getSlottedWUresources(contents){
	//console.log("parsing " +contents);
	let res = null;
	xmlparser.parseString(contents, function(err, parsed){
		if(err){
			console.log("error parsing xml file");
		} else {
			let gpu_type_raw = parsed.app_init_data.gpu_type;
			let wu = {};

			if (gpu_type_raw == "intel_gpu"){
				wu.isIntel = true;
				wu.isNvidia = false;
			} else if(gpu_type_raw == "NVIDIA"){
				wu.isIntel = false;
				wu.isNvidia = true;
			} else {
				wu.isIntel = false;
				wu.isNvidia = false;
			}

			wu.slot = parsed.app_init_data.slot[0];
			// ... continue to get some useful stuff

            res = wu;
		}
	});

	return res;
}

function getSlottedWUmetadata(contents){
    //console.log("parsing " +contents);
	let res = null;
    xmlparser.parseString(contents, function(err, parsed){
        if(err){
            console.log("error parsing xml file");
            return null;
        } else {
            let wu = {};

           wu.project_url = parsed.active_task.project_master_url[0];
           wu.task_name = parsed.active_task.result_name[0];

            res = wu;
        }
    });

    return res;
}

function getWU(raw_contents){
    var res = [];

    let parsed = xmlparser.xml2js(raw_contents, {compact: true});

    console.dir(parsed);

    if(parsed != null){
        const wus = parsed.client_state.workunit;
        const apps = parsed.client_state.app_version;
        const results = parsed.client_state.result;
        const active_tasks = parsed.client_state.active_task_set.active_task;


        console.log("Found " + wus.length + " work units");
        console.dir(wus);
        console.dir(apps);
        console.dir(results);
        console.dir(active_tasks);

        for(let wu of wus){
            console.log("=========");
            console.dir(wu);
            let o = {};
            let wu_task_name = wu.name;
            let wu_app_name = wu.app_name;
            let wu_app_version = wu.version_num;

            // get plan class
            let app_plan_class = null;
            try {
                app_plan_class = _.find(apps, {app_name: wu_app_name, version_num: wu_app_version}).plan_class;
                console.log(app_plan_class);
            }
            catch(error) {
            }

            let result_name = null;
            try {
                result_name = _.find(results, {wu_name: wu.name}).name;
                console.log(result_name);
            }
            catch(error) {
            }

            let project_url = null;
            try {
                project_url = _.find(active_tasks, {result_name: result_name}).project_master_url;
                console.log(project_url);
            }
            catch(error) {
                console.error("getting project url")
            }

            /*if(app_plan_class == null){
                console.log("wu found - is cpu");
                o.isNvidia = false;
                o.isIntel = false;
                o.isCpu = true;
            } else {
                console.log("wu found class " + app_plan_class);

                // check platform
                if(checkIsNvidia(app_plan_class)) {
                    console.log("is nvidia");
                    o.isNvidia = true;
                    o.isIntel = false;
                    o.isCpu = false;
                } else if (checkIsAti(app_plan_class)){

                } else if (checkIsIntel(app_plan_class)){
                    console.log("is intel");
                    o.isNvidia = false;
                    o.isIntel = true;
                    o.isCpu = false;
                } else if (checkIsVb(app_plan_class)){
                    console.log("is VB");
                } else {
                    // it is CPU only
                    console.log("is cpu");
                    o.isNvidia = false;
                    o.isIntel = false;
                    o.isCpu = true;
                }
            }

            res.push(o);*/

        }

        return res;


    }

    /*xmlparser.parseString(raw_contents, function(err, parsed){
        if(err){
            console.log("error parsing xml file");
            return null;
        } else {
            console.dir(parsed.client_state);
            const wus = parsed.client_state.workunit;
            const apps = parsed.client_state.app_version;

            console.log("Found " + wus.length + " work units");
            console.dir(wus);
            console.dir(apps);

            // iterate over WU to append plan class
            for(let wu of wus){
                let o = {};
                o.task_name = wu.name;
                let wu_app_name = wu.app_name;
                let wu_app_version = wu.version_num;

                // get plan class
                let app_plan_class = _.find(apps, {app_name: wu_app_name, version_num: wu_app_version}).plan_class;

                if(app_plan_class === undefined){
                    console.log("wu found - is cpu");
                    o.isNvidia = false;
                    o.isIntel = false;
                    o.isCpu = true;
                } else {
                    console.log("wu found class " + app_plan_class[0]);

                    // check platform
                    if(checkIsNvidia(app_plan_class[0])) {
                        console.log("is nvidia");
                        o.isNvidia = true;
                        o.isIntel = false;
                        o.isCpu = false;
                    } else if (checkIsAti(app_plan_class[0])){

                    } else if (checkIsIntel(app_plan_class[0])){
                        console.log("is intel");
                        o.isNvidia = false;
                        o.isIntel = true;
                        o.isCpu = false;
                    } else if (checkIsVb(app_plan_class[0])){
                        console.log("is VB");
                    } else {
                        // it is CPU only
                        console.log("is cpu");
                        o.isNvidia = false;
                        o.isIntel = false;
                        o.isCpu = true;
                    }
                }

                console.dir(o);
                console.dir(res);
            };
        }
    });*/

    return res;
}

function getApps(raw_contents){

}

function checkIsNvidia(raw_class){
    let found = false;

    found = _.some(PLAN_CLASSES_NVIDIA, (p) => {
        return _.includes(raw_class, p);
    });

    return found;
}

function checkIsIntel(raw_class){
    let found = false;

    found = _.some(PLAN_CLASSES_INTEL, (p) => {
        return _.includes(raw_class, p);
    });

    return found;
}

function checkIsAti(raw_class){
    return false;
}

function checkIsVb(raw_class){
    return false;
}