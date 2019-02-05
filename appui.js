const bcontrol = require("./boincmd_driver");
const parser = require("./parser");


var timerControl = Vue.component('timer-control', {
  data: function () {
    return {
        selected_gpus: 3,
        timer_options: [
            {text: 'Nvidia', value: 0},
            {text: 'Intel', value: 1},
            {text: 'Both', value: 2},
            {text: 'None', value: 0}
        ],
        timerValue: -1,
        isArmed: false
    }
  },
  template: `<p>Arm timer for 
			<select v-model="selected_gpus">
			  <option v-for="option in timer_options" v-bind:value="option.value">
				{{ option.text }}
			  </option>
			</select>
			: 
			<input type="number" v-model="timerValue" /> 
			<button class="uk-button" v-on:click="toggleTimer"><span v-if="!isArmed">Arm</span><span v-else>Disarm</span></button>
			</p>`,
	methods:{
        toggleTimer: function(){
			console.log("toogling timer state");
			if(this.isArmed){
				vm.stopTimer();
				this.isArmed = false;
			} else {
				vm.startTimer(this.timerValue);
				this.isArmed = true;
			}
		}
	}
});

var crunchControl = Vue.component('crunch-control', {
  props: {
	nvidiastatus: Boolean,
	intelstatus: Boolean
  },
  template: `
			<div >
			    <i>Allow or disallow GPU crunching - click to toggle state</i>
				<p uk-margin >
				<button class="uk-button uk-button">Toogle all</span></button>
				<button class="uk-button uk-button-large" v-on:click="toggleIntel" v-bind:class="intelstatus ? 'on' : 'off'" >Intel - <span v-if='intelstatus'>ON</span><span v-else>OFF</span></button>
				<button class="uk-button uk-button-large" v-on:click="toggleNvidia" v-bind:class="nvidiastatus ? 'on' : 'off'">Nvidia - <span v-if='nvidiastatus'>ON</span><span v-else>OFF</span></button>
				</p>	
			</div>`,
	methods: {
        toggleNvidia: function(){
            vm.setNvidiaStatus(!vm.isNvidiaEnabled);
        },

        toggleIntel: function(){
            vm.setIntelStatus(!vm.isIntelEnabled);
        }
	}
});


var tableControl = Vue.component('table-control', {
    props: {
        tasks: Array
    },
    template: `
			<table class="uk-table uk-table-striped">
			<caption></caption>
			<thead>
				<tr>
					<th>Name</th>
					<th>Target</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for='task in tasks' :key="task.slot">
					<td>{{task.task_name}}</td>
					<td v-if="task.isNvidia">Nvidia</td>
					<td v-else-if="task.isIntel">Intel</td>
					<td v-else-if="task.isCpu">CPU</td>
					<td v-else>-</td>
				</tr>
			</tbody>
		</table>`
});





var vm = new Vue({
  el: '#app',
  data: {
    wus: null,
	isIntelEnabled: true,
	isNvidiaEnabled: true,
  },
  components: {timerControl: timerControl, crunchControl: crunchControl, tableControl: tableControl},
  methods: {
	setIntelStatus: function(state){
		console.log("root - setting intel status");
		this.isIntelEnabled = state;

		bcontrol.suspendAllIntel(tasks);

	},
	
	setNvidiaStatus: function(state){
		console.log("root - setting nvidia status");
		this.isNvidiaEnabled = state;

        bcontrol.suspendAllNvidia(tasks);
	},


      startTimer: function(time){
	        console.log("running timer...");
          setTimeout(doOnTimerFired, time);

      }
  }
});

let tasks = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log("setting boinc cli path");
    bcontrol.setCliPath("D:\\BOINC\\boinccmd.exe");

    console.log("refreshing tasks list");
    tasks = parser.refreshWUlist("D:\\BOINC_DATA\\");
    vm.wus = tasks;
    console.dir(vm.wus);
});

function doOnTimerFired(){
    alert("timer has fired");
}

