import { IconButton, MenuItem, TextField } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import SystemUpdateAltIcon from '@material-ui/icons/SystemUpdateAlt';
import React from 'react';
import { ipcRenderer } from '../../../services/ipcRenderer';
import { FORM_TITLE } from './constants';
import { appMetaFormStyles } from './styles';

// App type option interface
export interface AppTypeOption {
  name: string;
  label: string;
}

// AppMetaForm props interface
interface AppMetaFormProps {
  userInput: { [key: string]: any };
  setFieldValueHandler: (fieldName: string, fieldValue: any) => void;
  submitted: boolean;
}

// AppTypeForm component
export default function AppMetaForm(props: AppMetaFormProps) {
  const classes = appMetaFormStyles();
  const { userInput, setFieldValueHandler, submitted } = props;
  const [divisionList, setDivisionList] = React.useState<any[]>([]);
  const [districtList, setDistrictList] = React.useState<any[]>([]);
  const [upazilaList, setUpazilaList] = React.useState<any[]>([]);


  const onChangeHandler = async (event: any) => {
    setFieldValueHandler(event.target.name, event.target.value);
    if (event.target.name == 'division') {
      const districtList: any = await ipcRenderer.sendSync('fetch-district', event.target.value);
      // console.log(divisionList, typeof divisionList)
      setDistrictList(districtList.district);
      setUpazilaList([]);
    } else if(event.target.name == 'district') {
      const upazilaList: any = await ipcRenderer.sendSync('fetch-upazila', userInput['division'], event.target.value);
      // console.log(divisionList, typeof divisionList)
      setUpazilaList(upazilaList.upazila);
    }
  };
  const division = 'division';
  const district = 'district';
  const upazila = 'upazila';

  const compUpdate = async () => {
    const divisionList: any = await ipcRenderer.sendSync('fetch-division');
    setDivisionList(divisionList.division);
    if (userInput['division'] != '') {
      const districtList: any = await ipcRenderer.sendSync('fetch-district', userInput['division']);
      // console.log(divisionList, typeof divisionList)
      setDistrictList(districtList.district);
      setUpazilaList([]);
    } 
    if(userInput['district'] != '') {
      const upazilaList: any = await ipcRenderer.sendSync('fetch-upazila', userInput['division'], userInput['district']);
      // console.log(divisionList, typeof divisionList)
      setUpazilaList(upazilaList.upazila);
    }
  };

  React.useEffect(() => {
    compUpdate();
  }, []);

  return (
    <div className={classes.layout}>
      <Typography variant="h6" gutterBottom={true}>
        {FORM_TITLE}
        <IconButton aria-label="update catchment">
          <SystemUpdateAltIcon />
        </IconButton>
      </Typography>
      <Grid container={true} spacing={3}>
        <Grid item={true} xs={12}>
          <TextField
            select={true}
            required={true}
            id={division}
            name={division}
            label="Division"
            variant="outlined"
            onChange={onChangeHandler}
            value={userInput[division] || ''}
            error={submitted && userInput[division] == undefined}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {divisionList.map((option: { div_id: number; division : string }) => (
              <MenuItem key={option.div_id} value={option.div_id}>
                {option.division}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            select={true}
            required={true}
            id={district}
            name={district}
            label="District"
            variant="outlined"
            onChange={onChangeHandler}
            value={userInput[district] || ''}
            error={submitted && userInput[district] == undefined}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {districtList.map((option: { dis_id: number; district : string }) => (
              <MenuItem key={option.dis_id} value={option.dis_id}>
                {option.district}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            select={true}
            required={true}
            id={upazila}
            label="Upazila"
            name={upazila}
            variant="outlined"
            onChange={onChangeHandler}
            value={userInput[upazila] || ''}
            error={submitted && userInput[upazila] == undefined}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {upazilaList.map((option: { upz_id: number; upazila : string }) => (
              <MenuItem key={option.upz_id} value={option.upz_id}>
                {option.upazila}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>
    </div>
  );
}
