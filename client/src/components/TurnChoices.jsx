import React, { useEffect, useState } from 'react';
import socket from '../socket';

const TurnChoices = (props) => {

    const [showSlider, setShowSlider] = useState(false);
    const [betRaise, setBetRaise] = useState('');
    const [highestBet, setHighestBet] = useState(props.currentBlind);

    useEffect(() => {
        socket.on('returnHighestBet', (_highestBet) => {
            setHighestBet(_highestBet);
        });
        return () => {
            socket.off('returnHighestBet');
        };
    }, []);

    const sendChoice = (choice) => {
        console.log(choice);
        if (choice == 'bet' || choice == 'raise')
        {
            // Create bet/raise popup
            setShowSlider(true);

            if (choice == 'raise') 
            {
                setBetRaise('raise');

                // Get the highest current bet from the server
                socket.emit('getHighestBet', props.lobbyName);
            }
            else setBetRaise('bet');
        }
        else 
        {
            socket.emit('turnChoice', props.lobbyName, choice);
        }
    };

    return(
        <>
            {props.choices.map((choice, index) => (
                <button className="choice" onClick={() => sendChoice(choice)}  key={index}>
                    {choice}
                </button>
            ))}
            <DraggableSlider showSlider={showSlider} startAmount={props.currentBlind + highestBet} choice={betRaise} lobbyName={props.lobbyName}/>
        </>
    );
}

const DraggableSlider = (props) => {

    const [value, setValue] = useState(props.startAmount);
    const [showSlider, setShowSlider] = useState(props.showSlider);

    useEffect(() => {
        setShowSlider(props.showSlider);
    }, [props.showSlider]);

    const handleValue = (event) => {
        setValue(event.target.value);
    }

    const handleConfirm = () => {
        // Check for wrongly inputted values

        socket.emit('turnChoice', props.lobbyName, props.choice, value);
        setShowSlider(false);
    }

    return(
        <>
            {
                showSlider && (
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