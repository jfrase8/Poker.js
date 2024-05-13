import React, { useEffect, useState } from 'react';
import socket from '../socket';

const BetBox = ({ showBox, updateShowBox, startAmount, choice, lobbyName, currentChips }) => {

    const [value, setValue] = useState(startAmount);
    const [orgChoice, setOrgChoice] = useState(choice);

    useEffect(() => {
        setValue(startAmount);
    }, [startAmount]);

    useEffect(() => {
        let convertedVal = parseInt(value);
        if (!isNaN(convertedVal)){
            if (value >= currentChips) {
                setOrgChoice('All In');
            } else {
                setOrgChoice(choice);
            }
        }
    }, [value, choice]);

    const handleValue = (event) => {
        setValue(event.target.value);
    }

    const handleConfirm = () => {
        /* Input Checking */
        let regex = /^\d+$/; // Regular expression to match only digits

        // Make sure value only contains digits
        if (!regex.test(value))
        {
            alert("Please enter a valid chip amount");
            return;
        }

        let convertedVal = parseInt(value);

        if (convertedVal > currentChips) convertedVal = currentChips // Go all in

        // Make sure value is at least the current big blind
        if (convertedVal < startAmount && choice == 'bet')
        {
            alert("Bet must be at least the big blind");
            return;
        }
        else if (convertedVal < startAmount)
        {
            alert("If you raise, you must add on at least the big blind to the highest current bet");
            return;
        }

        socket.emit('turnChoice', lobbyName, choice, convertedVal);
        updateShowBox(false);
    }

    return( 
        <>
            {
                showBox && (
                    <div>
                        <input type='text' value={value} className='betBox' onChange={handleValue} />
                        <button className='betConfirm' onClick={handleConfirm}>{orgChoice}</button>
                    </div>
                )
            }
        </>
    )
}

export default BetBox;