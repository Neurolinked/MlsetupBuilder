#MlsetupBuilder
## 1.6.9
### Done
### Todo 
- [ ] Code cleanup
- [ ] Layer interface selection events unified
  - [ ] Layer property read from Mlsetup instance instead of the interface
- [ ] Material Composer extension
  - [ ] Appearances Editor
  - [ ] Panels column slider
  - [ ] Content list and editor together
- [ ] Mlsetup autocompile in Wolvenkit project from raw to archive folder

## Todo 1.6.8
- [x] Packages upgrade
- [x] Redesign preferences
  - [x] Unbundle and depot folder reunified
  - [x] access to Mod path source files
- [x] New model Library based on DataTables
  - [x] Custom model addition and remove
  - [x] Row grouping by type : vanilla, custom
  - [x] Tag addition and complex filtering on
    - [ ] default tag filter configuration 
  - [x] Search in the library on filter enter press
- [x] new Material library
  - [ ] Thumbnails rebuild
- [ ] Microblends update
- [x] Replacing DAT.gui with Tweakpane library
  - [x] Light configuration addition 
  - [x] Camera far/near distance configurable
  - [x] Fog configuration addition
  - [x] Editor configuration parameters
  - [x] Debug options
    - [x] Models debug option
    - [x] Textures debug option
- [x] Three.js library Update
  - [x] Rewriting the 3d management code to be more maintainable
  - [ ] Add fx support (partial)
- [x] Loaded Textures panel with preview
  - [x] Doubleclick on the Texture Preview player to export the texture in PNG format
- [x] New shaders management based on .Material.json file
  - [x] Assign shaders as from appearances
  - [x] masks loading from material configuration
  - [x] multilayer.mt conversion to three.js format (partial)
  - [x] metal_base.remt conversion to three.js format
  - [x] mesh_decal.mt conversion to three.js format
- [x] Custom models Material.json search and usage
- [x] Material Database and preview updated at PL last release
- [x] UI redesign for the new materials management
- [ ] Material Composer extension (postponed)
- [x] Interface Workspace setup saved and reloaded from session to session
- [x] Keyboard shortcut override
  - [x] CTRL+A Apply the edits on the current layer
- [x] Mlsetup import preview skip
- [x] PouchDB database support
  - [x] Management model addition
- [x] DotNet Framework check installation check

### Todo 1.6.7
- [x] Cleanup in the import function
- [x] Support the newest Wolvenkit console 1.8.1
  - [x] Adapt to the new system of loading 3d models from the library
  - [x] In-demand mesh/masks export
- [x] A circular Array for different CSS Workspaces
- [x] Layer Multiselect for cleaning more then once at the time
- [x] The tool could remember the name of the last file it opened and pre-set it in the output panel
- [x] add the assets/environment folder to the models lists
- [x] MLSB start with a fixed window size too little for 4k monitor (autoresize)
