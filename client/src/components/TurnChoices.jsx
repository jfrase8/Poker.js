import React, { useEffect, useState } from 'react';
import socket from '../socket';
import BetBox from './BetBox';

const TurnChoices = (props) => {

    const [showBox, setShowBox] = useState(false);
    const [betRaise, setBetRaise] = useState('');
    const [minBetRaise, setMinBetRaise] = useState(props.currentBlind*2);

    useEffect(() => {
        socket.on('returnHighestBet', (_highestBet) => {
            console.log("highest bet: ", _highestBet);
            setMinBetRaise(props.currentBlind + _highestBet);
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
            setShowBox(true);

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
            <BetBox showBox={showBox} startAmount={minBetRaise} choice={betRaise} lobbyName={props.lobbyName}/>
        </>
    );
}

export default TurnChoices;