import {Container} from 'react-bootstrap';

import MainNav from './MainNav';
import React from 'react';

export default function PageFooter() {
  return (
    <footer className="page-footer">
      <Container>
        <MainNav />
        <p>&copy; Bram Vanroy 2022</p>
      </Container>
    </footer>
  );
}
