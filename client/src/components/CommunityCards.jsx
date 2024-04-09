import React, { useEffect, useState } from 'react';
import Card from './Card';
import socket from '../socket';

const CommunityCards = (props) => {

    return(
        <>
            <div className="communityCards">
                {this.props.flop.map((card, index) => (<Card key={index} suit={card.suit} value={card.value} background={card.imageURL}/>))}
                {<Card key={index} suit={this.props.turnCard.suit} value={this.props.turnCard.value} background={this.props.turnCard.imageURL}/>}
                {<Card key={index} suit={this.props.riverCard.suit} value={this.props.riverCard.value} background={this.props.riverCard.imageURL}/>}
                {}
            </div>
        </>
    );
};

export default CommunityCards;
