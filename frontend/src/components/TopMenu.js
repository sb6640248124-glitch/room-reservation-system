import React from 'react';
import { Link } from 'react-router-dom';

function TopMenu() {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        Room Reservation
      </div>

      <div style={styles.menu}>
        <Link style={styles.link} to="/">Home</Link>
        <Link style={styles.link} to="/rooms">Rooms</Link>
        <Link style={styles.link} to="/admin/rooms">Admin</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 30px',
    backgroundColor: '#2c3e50',
    color: 'white'
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold'
  },
  menu: {
    display: 'flex',
    gap: '20px'
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontWeight: '500'
  }
};

export default TopMenu;
