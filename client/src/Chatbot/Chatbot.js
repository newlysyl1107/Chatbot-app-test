import Axios from 'axios';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { saveMessage } from '../_actions/message_actions';
import Message from './Sections/Message';
import { List, Icon, Avatar } from 'antd';
import Card from './Sections/Card';

/*
일반적인 채팅 어플리케이션이면 DB에 메시지를 저장하지만,
챗봇의 경우 새로고침을 하면 기존 내용이 사라지고 새로운 대화가 시작되므로 DB에 저장할 필요가 없다.

DB에 저장하지 않는 경우 메시지를 저장하는 장소는 두 가지가 있다.
1. state
2. redux store

이번 프로젝트는 2. redux store 에 저장하는 것으로 구현한다.
*/

function Chatbot() {
    const dispatch = useDispatch();
    const messagesFromRedux = useSelector(state => state.message.messages)

    useEffect(() => {
        eventQuery('welcomeToMyWebsite');
    }, [])

    const textQuery = async (text) => {

        // 먼저, 사용자가 입력한 메시지를 처리
        let conversation = {
            who: 'user',
            content: {
                text: {
                    text: text
                }
            }
        }

        dispatch(saveMessage(conversation));
        //console.log('text i sent = ', conversation);

        // 챗봇이 보낸 메시지를 처리
        const textQueryVariables = {
            text
        }

        try {
            // text Query route 에 request 를 보낸다.
            const response = await Axios.post('/api/dialogflow/textQuery', textQueryVariables)

            for(let content of response.data.fulfillmentMessages) {
                conversation = {
                    who: 'bot',
                    content: content
                }
    
                dispatch(saveMessage(conversation));
            }

        } catch (error) {
            conversation = {
                who: 'bot',
                content: {
                    text: {
                        text: "에러가 발생하였습니다."
                    }
                }
            }

            dispatch(saveMessage(conversation));
        }
    }

    const eventQuery = async (event) => {

        // 챗봇이 보낸 메시지를 처리
        const eventQueryVariables = {
            event
        }

        try {
            // text Query route 에 request 를 보낸다.
            const response = await Axios.post('/api/dialogflow/eventQuery', eventQueryVariables)
            for(let content of response.data.fulfillmentMessages) {
                let conversation = {
                    who: 'bot',
                    content: content
                }
    
                dispatch(saveMessage(conversation));
            }

        } catch (error) {
            let conversation = {
                who: 'bot',
                content: {
                    text: {
                        text: "에러가 발생하였습니다."
                    }
                }
            }
            dispatch(saveMessage(conversation));
        }
    }

    const keyPressHandler = (event) => {
        if(event.key === "Enter") {

            // 아무것도 입력하지 않았을 때
            if(!event.target.value) {
                return alert('메시지를 입력해 주세요.');
            }

            // textQuery route 에 request 보내기
            // 그 후 input 을 빈칸으로 만들어준다.
            textQuery(event.target.value);

            event.target.value = ''; 
        }
    }

    const renderCards = (cards) => {
        return cards.map((card, i) => <Card key={i} cardInfo={card.structValue} />)
    }

    const renderOneMessage = (message, i) => {
        console.log(message);
        // 메시지 타입에 따라 분기처리를 해준다.
        // 1. 일반 메시지 형식
        if(message.content && message.content.text && message.content.text.text) {
            return <Message key={i} who={message.who} text={message.content.text.text}  />
        } else if(message.content && message.content.payload.fields.card) {

            const AvatarSrc = message.who === "bot" ? <Icon type="robot" /> : <Icon type="smile" />

            return <div>
                <List.Item style={{ padding: '1rem' }}>
                    <List.Item.Meta 
                        avatar={<Avatar icon={AvatarSrc} />}
                        title={message.who}
                        description={renderCards(message.content.payload.fields.card.listValue.values)}
                    />
                </List.Item>
            </div>
        }

        // 2. 카드 메시지 형식


    }

    const renderMessage = (returnedMessages) => {

        if(returnedMessages) {
            // 메시지를 하나하나 처리하기 위해 map() 메소드를 사용한다.
            return returnedMessages.map((message, i) => {
                return renderOneMessage(message, i);
            })
        } else {
            return null;
        }

    }

    return (
        <div style={{ height: 700, width: 700, 
                        border: '3px solid black', borderRadius: '7px'}}>
            <div style={{ height: 644, width: '100%', overflow: 'auto' }}>
                
                {renderMessage(messagesFromRedux)}

            </div>

            <input style={{ margin: 0, width: '100%', height: 50,
                            borderRadius: '4px', padding: '5px', fontSize: '1rem' }}
                    placeholder="메시지를 입력해 주세요..."
                    type="text"
                    onKeyPress={keyPressHandler}/>
        </div>
    )
}


export default Chatbot;