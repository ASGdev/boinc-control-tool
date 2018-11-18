// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const fs = require('fs');
const path = require('path');
const xmlparser = require('xml2js');

const SETTINGS_FILE_PATH = "./settings.json";

let BOINC_DATA_PATH = null;


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
    refreshWUlist: function(slots_dir){
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
                let ress = getWUresources(raww);

                let raw = fs.readFileSync(meta_file_path);
                let res = getWUmetadata(raw);

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
    }
}


function getSlotsCount(slots_dir){
	return fs.readdirSync(slots_dir).filter(f => fs.statSync(path.join(slots_dir, f)).isDirectory()).length;
}

function getWUresources(contents){
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

function getWUmetadata(contents){
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