set -e 
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"xml_submission_file":"<?xml version=\"1.0\" encoding=\"UTF-8\" ?><staff id=\"staff\"><division>30</division><district>3093</district><upazila>309328</upazila><staffid>88888888</staffid><staffname>eight</staffname><meta><instanceID>ghatail-a62c2e47-ee7b-4c4f-8204-78a084eae7d0</instanceID></meta><formhub><uuid>ec0e6ae182b242b1a88738ee90aaae10</uuid></formhub></staff>"}' \
  http://localhost/bhmodule/ghatail/submission/ > locahos.html

cwbreak

curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"xml_submission_file":"<?xml version=\"1.0\" encoding=\"UTF-8\" ?><staff id=\"staff\"><division>30</division><district>3093</district><upazila>309328</upazila><staffid>43434</staffid><staffname>ddddfffd</staffname><meta><instanceID>ghatail-10e5e774-eab1-4cb1-9139-0d379114cfa6</instanceID></meta><formhub><uuid>ec0e6ae182b242b1a88738ee90aaae10</uuid></formhub></staff>"}' \
  http://www.bahis2-dev.net/bhmodule/ghatail/submission/ > monster_betterxml.html


curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"xml_submission_file":"<?xml version=\"1.0\" encoding=\"UTF-8\" ?><staff id=\"staff\"><division>30</division><district>3093</district><upazila>309328</upazila><staffid>43434</staffid><staffname>ddddfffd</staffname><meta><instanceID>ghatail-10e5e774-eab1-4cb1-9139-0d379114cfa6</instanceID></meta><formhub><uuid>ec0e6ae182b242b1a88738ee90aaae10</uuid></formhub></staff>"}' \
http://dyn-bahis-dev.mpower-social.com/bhmodule/ghatail/submission/ > mpower_deverror.html


curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"xml_submission_file":"<?xml version=\"1.0\" encoding=\"UTF-8\" ?><staff id=\"staff\"><division>30</division><district>3093</district><upazila>309328</upazila><staffid>43434</staffid><staffname>ddddfffd</staffname><meta><instanceID>ghatail-10e5e774-eab1-4cb1-9139-0d379114cfa6</instanceID></meta><formhub><uuid>ec0e6ae182b242b1a88738ee90aaae10</uuid></formhub></staff>"}' \
http://dynamic-bahis.mpower-social.com/bhmodule/ghatail/submission/ > mpower_dynamic.html