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
                    <p style={{ color: 'black' }}>Confirm</p>{' '}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        are you sure you want to submit the form? You cannot click "Yes" if your form contains errors, click
                        "No" and correct.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => props.yes()} style={{ color: 'white', backgroundColor: 'green' }}>
                        yes
                    </Button>
                    <Button onClick={() => props.cancel()} color="primary" style={{ color: 'white', backgroundColor: 'red' }}>
                        No
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
