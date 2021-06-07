export const PAGINATION_SIZE = 20;
export type PAGINATION_SIZE = typeof PAGINATION_SIZE;

export const ColumnnDefinition = [
    {
      "exportable": true,
      "data_type": "text",
      "format": "",
      "label": {
        "Bangla": "Farm ID",
        "English": "Farm ID"
      },
      "sortable": true,
      "hidden": false,
      "field_name": "basic_info_farmid",
      "order": "1"
    },
    {
      "exportable": true,
      "data_type": "text",
      "format": "",
      "label": {
        "Bangla": "Initial Visit Date",
        "English": "Initial Visit Date"
      },
      "sortable": true,
      "hidden": false,
      "field_name": "basic_info_date",
      "order": "2"
    },
    {
      "exportable": true,
      "data_type": "text",
      "format": "",
      "label": {
        "Bangla": "Union/City",
        "English": "Union/City"
      },
      "sortable": true,
      "hidden": false,
      "field_name": "basic_info_union",
      "order": "3"
    },
    {
      "exportable": true,
      "data_type": "text",
      "format": "",
      "label": {
        "Bangla": "Mouza/Ward",
        "English": "Mouza/Ward"
      },
      "sortable": true,
      "hidden": false,
      "field_name": "basic_info_mouza",
      "order": "4"
    },
    {
      "exportable": true,
      "data_type": "text",
      "format": "",
      "label": {
        "Bangla": "Village",
        "English": "Village"
      },
      "sortable": true,
      "hidden": false,
      "field_name": "basic_info_village",
      "order": "5"
    },
    {
      "exportable": true,
      "data_type": "text",
      "format": "",
      "label": {
        "Bangla": "Mobile No",
        "English": "Mobile No"
      },
      "sortable": true,
      "hidden": false,
      "field_name": "basic_info_mobile",
      "order": "6"
    },
    {
      "exportable": true,
      "data_type": "text",
      "format": "",
      "label": {
        "Bangla": "Owners Name",
        "English": "Owners Name"
      },
      "sortable": true,
      "hidden": false,
      "field_name": "basic_info_owner",
      "order": "7"
    },
    {
      "exportable": true,
      "data_type": "text",
      "format": "",
      "label": {
        "Bangla": "Ownership Type",
        "English": "Ownership Type"
      },
      "sortable": true,
      "hidden": false,
      "field_name": "basic_info_ownership_type",
      "order": "8"
    },
    {
      "action_definition": [
        {
          "details_pk": 0,
          "xform_id": 235,
          "label": {
            "Bangla": "Farm Assessment next Visit",
            "English": "Farm Assessment next Visit"
          },
          "form_title": "FARM ASSESSMENT MONITORING",
          "action_type": "entry",
          "data_mapping": [
            {
              "column": "basic_info_date",
              "form_field": "basic_info/date"
            },
            {
              "column": "basic_info_union",
              "form_field": "basic_info/union"
            },
            {
              "column": "basic_info_village",
              "form_field": "basic_info/village"
            },
            {
              "column": "basic_info_ownership_type",
              "form_field": "basic_info/ownership_type"
            },
            {
              "column": "basic_info_mouza",
              "form_field": "basic_info/mouza"
            },
            {
              "column": "basic_info_owner",
              "form_field": "basic_info/owner"
            },
            {
              "column": "basic_info_mobile",
              "form_field": "basic_info/mobile"
            }
          ]
        },
        {
          "details_pk": 0,
          "xform_id": 235,
          "label": {
            "Bangla": "Closure Report",
            "English": "Closure Report"
          },
          "form_title": "FARM ASSESSMENT MONITORING",
          "action_type": "entry",
          "data_mapping": [
            {
              "column": "basic_info_date",
              "form_field": "basic_info/date"
            },
            {
              "column": "basic_info_union",
              "form_field": "basic_info/union"
            },
            {
              "column": "basic_info_village",
              "form_field": "basic_info/village"
            },
            {
              "column": "basic_info_ownership_type",
              "form_field": "basic_info/ownership_type"
            },
            {
              "column": "basic_info_owner",
              "form_field": "basic_info/owner"
            },
            {
              "column": "basic_info_mobile",
              "form_field": "basic_info/mobile"
            }
          ]
        },
        {
          "details_pk": "basic_info_farmid",
          "xform_id": 236,
          "label": {
            "Bangla": "Details",
            "English": "Details"
          },
          "form_title": "AVIAN INFLUENZA INVESTIGATION",
          "action_type": "details",
          "data_mapping": []
        },
        {
          "details_pk": "",
          "xform_id": 236,
          "label": {
            "Bangla": "AVIAN INFLUENZA INVESTIGATION",
            "English": "AVIAN INFLUENZA INVESTIGATION"
          },
          "form_title": "AVIAN INFLUENZA INVESTIGATION",
          "action_type": "entry",
          "data_mapping": [
            {
              "column": "basic_info_union",
              "form_field": "basic_info/union"
            },
            {
              "column": "basic_info_village",
              "form_field": "basic_info/village"
            },
            {
              "column": "basic_info_farmid",
              "form_field": "basic_info/farmid"
            },
            {
              "column": "basic_info_mouza",
              "form_field": "basic_info/mouza"
            },
            {
              "column": "basic_info_owner",
              "form_field": "basic_info/owner"
            },
            {
              "column": "basic_info_mobile",
              "form_field": "basic_info/mobile"
            }
          ]
        }
      ],
      "data_type": "action",
      "label": {
        "Bangla": "Action",
        "English": "Action"
      }
    }
  ]