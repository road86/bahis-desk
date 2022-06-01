  curl -X POST -d '{"id": "327", "submission": {
  "division": "30",
  "district": "3093",
  "upazila": "309328",
  "staffid": "43434",
  "staffname": "ddddfffd",
  "meta/instanceID": "ghatail-10e5e774-eab1-4cb1-9139-0d379114cfa6",
  "formhub/uuid": "ec0e6ae182b242b1a88738ee90aaae10"
}}' http://localhost:80/ghatail/submission -u ghatail:12345678 -H "Content-Type: application/json"

  curl -X POST -F xml_submission_file=ffff.xml http://localhost:80/ghatail/submission
