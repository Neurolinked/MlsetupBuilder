#MlsetupBuilder

### Todo 1.6.8
- [x] New model Library based on DataTables
  - [x] Row grouping by type : vanilla, custom
  - [ ] Row ordering based on grouping model name
- [ ] New shaders management based on .Material.json file
  - [ ] Assign shaders as from appearances
  - [ ] masks loading from material configuration
  - [ ] multilayer.mt conversion to three.js format
  - [ ] metal_base.remt conversion to three.js format
  - [ ] mesh_decal.mt conversion to three.js format
- [ ] Custom models Material.json search and usage
  - [ ] Override masks selection from legacy list
- [ ] UI redesign for the new materials management
- [ ] Material Composer extension
  - [ ] Appearances Editor
  - [ ] Panels column slider
  - [ ] Content list and editor together
- [ ] Layer interface selection events unified
  - [ ] Layer property read from Mlsetup instance instead of the interface
- [x] Interface Workspace setup saved and reloaded from session to session
- [x] Keyboard shortcut override
  - [x] CTRL+A Apply the edits on the current layer

### Todo 1.6.7
- [x] Cleanup in the import function
- [x] Support the newest Wolvenkit console 1.8.1
  - [x] Adapt to the new system of loading 3d models from the library
  - [x] In-demand mesh/masks export
- [x] A circular Array for different CSS Workspaces
- [x] Layer Multiselect for cleaning more then once at the time
- [x] The tool could remember the name of the last file it opened and pre-set it in the output panel
- [x] add the assets/environment folder to the models lists
- [x] MLSB start with a fixed window size too little for my 4k monitor (autoresize)
