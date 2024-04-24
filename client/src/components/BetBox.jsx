import React, { useEffect, useState } from 'react';
import socket from '../socket';

const BetBox = (props) => {

    const [value, setValue] = useState(props.startAmount);
    const [showBox, setShowBox] = useState(props.showBox);

    useEffect(() => {
        setShowBox(props.showBox);
        setValue(props.startAmount);
    }, [props.showBox, props.startAmount]);

    const handleValue = (event) => {
        setValue(event.target.value);
    }

    const handleConfirm = () => {
        // Check for wrongly inputted values

        socket.emit('turnChoice', props.lobbyName, props.choice, value);
        setShowBox(false);
    }

    return(console.log(props.startAmount), 
        <>
            {
                showBox && (
                    <div>
                        <input type='text' value={value} className='betBox' onChange={handleValue} />
                        <button className='betConfirm' onClick={handleConfirm}>{props.choice}</button>
                    </div>
                )
            }
        </>
    )
}

export default BetBox;