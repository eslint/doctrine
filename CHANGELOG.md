v1.0.0 - December 21, 2015

* New: parse caption tags in examples into separate property. (fixes #131) (Tom MacWright)

v0.7.2 - November 27, 2015

* Fix: Line numbers for some tags (fixes #138) Fixing issue where input was not consumed via advance() but was skipped when parsing tags resulting in sometimes incorrect reported lineNumber. (TEHEK)
* Build: Add missing linefix package (Nicholas C. Zakas)

v0.7.1 - November 13, 2015

* Update: Begin switch to Makefile.js (Nicholas C. Zakas)
* Fix: permit return tag without type (fixes #136) (Tom MacWright)
* Fix: package.json homepage field (Bogdan Chadkin)
* Fix: Parse array default syntax. Fixes #133 (Tom MacWright)
* Fix: Last tag always has \n in the description (fixes #87) (Burak Yigit Kaya)
* Docs: Add changelog (Nicholas C. Zakas)

v0.7.0 - September 21, 2015

* Docs: Update README with new info (fixes #127) (Nicholas C. Zakas)
* Fix: Parsing fix for param with arrays and properties (fixes #111) (Gyandeep Singh)
* Build: Add travis build (fixes #123) (Gyandeep Singh)
* Fix: Parsing of parameter name without a type (fixes #120) (Gyandeep Singh)
* New: added preserveWhitespace option (Aleks Totic)
* New: Add "files" entry to only deploy select files (Rob Loach)
* New: Add support and tests for typedefs. Refs #5 (Tom MacWright)
