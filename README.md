# fortune-js

Javascript fortune teller.

Now featuring:

* PWA - Progressive Web Application packaging
* Dynamic page update without need of user page refresh

## Notes

### Sorting database using jq

> cat quotes.json | jq 'sort_by(.author)'
