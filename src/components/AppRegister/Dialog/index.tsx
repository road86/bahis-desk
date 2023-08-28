import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default function AlertDialog(props: any) {
    return (
        <div>
            <Dialog open={props.open} aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description">
                <DialogTitle id="alert-dialog-title">
                    {' '}
                    <p style={{ color: 'black' }}>Login Warning</p>{' '}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        A different user has logged in before, Continue with this user will delete previous data. Are you sure
                        you want to delete the data ?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => props.handleClick('delete')} style={{ color: 'white', backgroundColor: 'red' }}>
                        Delete All and Login
                    </Button>
                    <Button onClick={() => props.handleClick('no')} color="primary" autoFocus>
                        No
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
