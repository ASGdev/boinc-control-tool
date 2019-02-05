# BOINC control tool (currently broken)

**Simple UI to control the BOINC client on local machine.**

This is build with web technologies using Electron and an in-house driver to control the local BOINC instance using XML-RPC.

**Please be aware that it is (extremely) badly written**

## To Use

```bash
# Clone this repository
# Go into the repository
cd boinc-control-tool
# Install dependencies
npm install
# Run the app
npm start
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.

## Why it is broken ?
The goal of this piece of software was to discriminate GPU jobs in two families : NVIDIA (sorry others) and INTEL, to allow a more efficient and comfortable use of my computer ressources. 

But, due to a recent misunderstanding of the jobs / tasks scheme, It does not work (for the moment).

## Read more
- Electron : https://electronjs.org/
- BOINC : https://boinc.berkeley.edu/, https://boinc.berkeley.edu/trac/wiki/ProjectMain (technical documentation)
- XML-RCP : https://en.wikipedia.org/wiki/XML-RPC
