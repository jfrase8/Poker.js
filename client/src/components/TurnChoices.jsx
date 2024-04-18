import React, { useEffect, useState } from 'react';
import socket from '../socket';

const TurnChoices = (props) => {

    const [showSlider, setShowSlider] = useState(false);
    const [betRaise, setBetRaise] = useState('');

    const sendChoice = (choice) => {
        console.log(choice);
        if (choice == 'bet' || choice == 'raise')
        {
            // Create bet/raise popup
            setShowSlider(true);

            if (choice == 'Bet') setBetRaise('bet');
            else setBetRaise('Raise');
        }
        else 
        {
            socket.emit('turnChoice', props.lobbyName, choice, betAmount);
        }
    };

    return(
        <>
            {props.choices.map((choice, index) => (
                <button className="choice" onClick={() => sendChoice(choice)}  key={index}>
                    {choice}
                </button>
            ))}
            <DraggableSlider showSlider={showSlider} startAmount={props.currentBlind} choice={betRaise} lobbyName={props.lobbyName}/>
        </>
    );
}

const DraggableSlider = (props) => {

    const [value, setValue] = useState(props.startAmount);

    const handleValue = (event) => {
        setValue(event.target.value);
    }

    const handleConfirm = () => {
        // Check for wrongly inputted values
        socket.emit('turnChoice', props.lobbyName, choice, value);
        props.showSlider = false;
    }

    return(
        <>
            {
                props.showSlider && (
                    <div>
                        <input type='text' value={value} className='slider' onChange={handleValue} 
                        placeholder={props.startAmount} />
                        <button className='betConfirm' onClick={handleConfirm}>{props.choice}</button>
                    </div>
                )
            }
        </>
    )
}

export default TurnChoices;