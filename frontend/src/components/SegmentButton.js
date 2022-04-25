import '../styles/segment-button.scss';

import {Button} from 'react-bootstrap';
import React from 'react';


export function AddOrRemoveBtn(props) {
  const onClick = () => {
    props.createNewSegment(props.id, props.side, props.type);
  };
  let className = 'btn-add-segment';
  className += props.type === 'add' ? ' add' : ' remove';
  return (
    <Button className={className} variant="light" onClick={onClick}>{props.type === 'add' ? '+' : '-'}</Button>
  );
}
