import '../styles/segment-button.scss';

import {Button} from 'react-bootstrap';
import React from 'react';


export function AddSegmentBtn(props) {
  const onClick = () => {
    props.createNewSegment(props.id, props.side);
  };
  return (
    <Button className="btn-add-segment" variant="light" onClick={onClick}>+</Button>
  );
}
