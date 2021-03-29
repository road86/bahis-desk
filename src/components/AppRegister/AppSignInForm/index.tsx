import { TextField } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import React from 'react';
import { FORM_TITLE } from './constants';
import { appSignInFormStyles } from './styles';

// AppSignInForm props interface
interface AppSignInFormProps {
  userInput: { [key: string]: any };
  setFieldValueHandler: (fieldName: string, fieldValue: any) => void;
  submitted: boolean;
  handleSignin: any;
}

// AppSignInForm component
export default function AppSignInForm(props: AppSignInFormProps) {
  const classes = appSignInFormStyles();
  const [inputRefs, setInputRef] = React.useState<any>();
  const { userInput, setFieldValueHandler, submitted, handleSignin } = props;
  const onChangeHandler = (event: any) => {
    setFieldValueHandler(event.target.name, event.target.value);
  };

  const username = 'username';
  const password = 'password';

  React.useEffect(() => {
    const ref = React.createRef();
    setInputRef(ref);
  }, []);

  const changeFocus = (e: any) => {
    const event = e;
    if (event.key === "Enter") {
      inputRefs.current.focus()
      event.preventDefault();
    }
  };

  const signIn = (e: any) => {
    const event = e;
    if (event.key === "Enter") {
      handleSignin();
      event.preventDefault();
    }
  };

  return (
    <div className={classes.layout}>
      <Typography variant="h6" gutterBottom={true}>
        {FORM_TITLE}
      </Typography>
      <Grid container={true} spacing={3}>
        <Grid item={true} xs={12}>
          <TextField
            required={true}
            id={username}
            name={username}
            label="Username"
            variant="outlined"
            onChange={onChangeHandler}
            inputProps={{ onKeyPress: changeFocus }}
            value={userInput[username] || ''}
            error={submitted && userInput[username] == undefined}
          />
        </Grid>
        <Grid item={true} xs={12}>
          <TextField
            required={true}
            id={password}
            name={password}
            type="password"
            label="Password"
            variant="outlined"
            inputRef={inputRefs}
            onChange={onChangeHandler}
            inputProps={{ onKeyPress: signIn }}
            value={userInput[password] || ''}
            error={submitted && userInput[password] == undefined}
          />
        </Grid>
      </Grid>
    </div>
  );
}
