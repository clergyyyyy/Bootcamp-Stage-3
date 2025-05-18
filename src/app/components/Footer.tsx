'use client';

import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
        <div>
          <h3 className="text-3xl !text-white font-semibold mb-2">Learn more</h3>
          <ul>
            <li>FanLink for Managers</li>
            <li>Top Creator Agencies 2024</li>
            <li>Creator Agencies</li>
            <li>Pricing</li>
          </ul>
        </div>
        <div>
          <h3 className="text-3xl !text-white font-semibold mb-2">Legal</h3>
          <ul>
            <li>Terms of service</li>
            <li>Privacy Policy</li>
            <li>Cookie Notice</li>
            <li>Report Violation</li>
            <li>Community Standards</li>
          </ul>
        </div>
        <div>
          <h3 className="text-3xl !text-white font-semibold mb-2">Help & Support</h3>
          <ul>
            <li>Help Center</li>
            <li>Need help?</li>
            <li>Email: support@FanLink.com</li>
          </ul>
        </div>
      </div>
      <div className="text-center text-sm mt-6">© 2025 FanLink. All rights reserved.</div>
    </footer>
  );
};

export default Footer;
