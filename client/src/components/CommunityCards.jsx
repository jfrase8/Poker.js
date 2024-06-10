import React, { useEffect, useState } from 'react';
import Card from './Card';
import socket from '../socket';

const CommunityCards = (props) => {
    return(
        <>
            <div className="communityCards">
                {props.cards.map((card, index) => (<Card key={index} suit={card.suit} value={card.value} />))}
            </div>
        </>
    );
};

export default CommunityCards;
