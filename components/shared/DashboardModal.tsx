"use client";

import React from "react";
import Modal from "@/components/shared/modal";

interface DashboardModalProps {
  showModal: boolean;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardModal: React.FC<DashboardModalProps> = ({ showModal, setShowModal }) => {
  return (
    <Modal showModal={showModal} setShowModal={setShowModal}>
      <div className="video-bg fixed inset-0">
        <video className="w-full h-full object-cover" autoPlay loop muted>
          <source src="https://assets.codepen.io/3364143/7btrrd.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div className="dark-light fixed bottom-12 right-12 p-2 bg-gray-800 shadow-md rounded-full cursor-pointer z-20">
        <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-yellow-400">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </div>
      <div className="app bg-opacity-40 backdrop-filter backdrop-blur-lg max-w-7xl w-full rounded-lg p-8 shadow-lg text-white"> {/* Updated width class */}
        <div className="header flex items-center border-b border-opacity-25 pb-4 mb-6">
          <div className="menu-circle w-4 h-4 bg-red-500 rounded-full mr-8"></div>
          <div className="header-menu flex space-x-6">
            <a href="#" className="menu-link is-active text-white">Apps</a>
            <a href="#" className="menu-link text-gray-400">Your work</a>
            <a href="#" className="menu-link text-gray-400">Discover</a>
            <a href="#" className="menu-link text-gray-400">Market</a>
          </div>
          <div className="search-bar flex-grow flex items-center ml-12">
            <input type="text" placeholder="Search" className="w-full h-10 bg-gray-800 text-white rounded-full pl-10 pr-4" />
          </div>
          <div className="header-profile flex items-center ml-auto">
            <div className="notification relative mr-6">
              <span className="notification-number absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">3</span>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <img className="profile-img w-10 h-10 rounded-full border-2 border-gray-200" src="https://images.unsplash.com/photo-1600353068440-6361ef3a86e8?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" alt="Profile" />
          </div>
        </div>
        <div className="wrapper flex overflow-hidden">
          <div className="left-side flex-shrink-0 w-1/4 p-4 overflow-auto border-r border-opacity-25">
            <div className="side-wrapper mb-6">
              <div className="side-title text-gray-400 mb-4">Apps</div>
              <div className="side-menu flex flex-col space-y-2">
                <a href="#" className="flex items-center text-white hover:bg-gray-800 p-2 rounded-lg">
                  <svg viewBox="0 0 512 512" className="w-5 h-5 mr-2">
                    <g xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                      <path d="M0 0h128v128H0zm0 0M192 0h128v128H192zm0 0M384 0h128v128H384zm0 0M0 192h128v128H0zm0 0" />
                      <path d="M192 192h128v128H192zm0 0M384 192h128v128H384zm0 0M0 384h128v128H0zm0 0M192 384h128v128H192zm0 0M384 384h128v128H384zm0 0" />
                    </g>
                  </svg>
                  All Apps
                </a>
                <a href="#" className="flex items-center text-white hover:bg-gray-800 p-2 rounded-lg">
                  <svg viewBox="0 0 488.932 488.932" className="w-5 h-5 mr-2" fill="currentColor">
                    <path d="M243.158 61.361v-57.6c0-3.2 4-4.9 6.7-2.9l118.4 87c2 1.5 2 4.4 0 5.9l-118.4 87c-2.7 2-6.7.2-6.7-2.9v-57.5c-87.8 1.4-158.1 76-152.1 165.4 5.1 76.8 67.7 139.1 144.5 144 81.4 5.2 150.6-53 163-129.9 2.3-14.3 14.7-24.7 29.2-24.7 17.9 0 31.8 15.9 29 33.5-17.4 109.7-118.5 192-235.7 178.9-98-11-176.7-89.4-187.8-187.4-14.7-128.2 84.9-237.4 209.9-238.8z" />
                  </svg>
                  Updates
                  <span className="ml-auto text-xs text-blue-500">3</span>
                </a>
              </div>
            </div>
            <div className="side-wrapper mb-6">
              <div className="side-title text-gray-400 mb-4">Categories</div>
              <div className="side-menu flex flex-col space-y-2">
                <a href="#" className="flex items-center text-white hover:bg-gray-800 p-2 rounded-lg">
                  <svg viewBox="0 0 488.455 488.455" className="w-5 h-5 mr-2" fill="currentColor">
                    <path d="M287.396 216.317c23.845 23.845 23.845 62.505 0 86.35s-62.505 23.845-86.35 0-23.845-62.505 0-86.35 62.505-23.845 86.35 0" />
                    <path d="M427.397 91.581H385.21l-30.544-61.059H133.76l-30.515 61.089-42.127.075C27.533 91.746.193 119.115.164 152.715L0 396.86c0 33.675 27.384 61.074 61.059 61.074h366.338c33.675 0 61.059-27.384 61.059-61.059V152.639c-.001-33.674-27.385-61.058-61.059-61.058zM244.22 381.61c-67.335 0-122.118-54.783-122.118-122.118s54.783-122.118 122.118-122.118 122.118 54.783 122.118 122.118S311.555 381.61 244.22 381.61z" />
                  </svg>
                  Photography
                </a>
                <a href="#" className="flex items-center text-white hover:bg-gray-800 p-2 rounded-lg">
                  <svg viewBox="0 0 512 512" className="w-5 h-5 mr-2" fill="currentColor">
                    <circle cx="295.099" cy="327.254" r="110.96" transform="rotate(-45 295.062 327.332)" />
                    <path d="M471.854 338.281V163.146H296.72v41.169a123.1 123.1 0 01121.339 122.939c0 3.717-.176 7.393-.5 11.027zM172.14 327.254a123.16 123.16 0 01100.59-120.915L195.082 73.786 40.146 338.281H172.64c-.325-3.634-.5-7.31-.5-11.027z" />
                  </svg>
                  Graphic Design
                </a>
                <a href="#" className="flex items-center text-white hover:bg-gray-800 p-2 rounded-lg">
                  <svg viewBox="0 0 58 58" className="w-5 h-5 mr-2" fill="currentColor">
                    <path d="M57 6H1a1 1 0 00-1 1v44a1 1 0 001 1h56a1 1 0 001-1V7a1 1 0 00-1-1zM10 50H2v-9h8v9zm0-11H2v-9h8v9zm0-11H2v-9h8v9zm0-11H2V8h8v9zm26.537 12.844l-11 7a1.007 1.007 0 01-1.018.033A1.001 1.001 0 0124 36V22a1.001 1.001 0 011.538-.844l11 7a1.003 1.003 0 01-.001 1.688zM56 50h-8v-9h8v9zm0-11h-8v-9h8v9zm0-11h-8v-9h8v9zm0-11h-8V8h8v9z" />
                  </svg>
                  Video
                </a>
                <a href="#" className="flex items-center text-white hover:bg-gray-800 p-2 rounded-lg">
                  <svg viewBox="0 0 512 512" className="w-5 h-5 mr-2" fill="currentColor">
                    <path d="M499.377 46.402c-8.014-8.006-18.662-12.485-29.985-12.613a41.13 41.13 0 00-.496-.003c-11.142 0-21.698 4.229-29.771 11.945L198.872 275.458c25.716 6.555 47.683 23.057 62.044 47.196a113.544 113.544 0 0110.453 23.179L500.06 106.661C507.759 98.604 512 88.031 512 76.89c0-11.507-4.478-22.33-12.623-30.488zM176.588 302.344a86.035 86.035 0 00-3.626-.076c-20.273 0-40.381 7.05-56.784 18.851-19.772 14.225-27.656 34.656-42.174 53.27C55.8 397.728 27.795 409.14 0 416.923c16.187 42.781 76.32 60.297 115.752 61.24 1.416.034 2.839.051 4.273.051 44.646 0 97.233-16.594 118.755-60.522 23.628-48.224-5.496-112.975-62.192-115.348z" />
                  </svg>
                  Illustrations
                </a>
                <a href="#" className="flex items-center text-white hover:bg-gray-800 p-2 rounded-lg">
                  <svg viewBox="0 0 512 512" className="w-5 h-5 mr-2" fill="currentColor">
                    <path d="M497 151H316c-8.401 0-15 6.599-15 15v300c0 8.401 6.599 15 15 15h181c8.401 0 15-6.599 15-15V166c0-8.401-6.599-15-15-15zm-76 270h-30c-8.401 0-15-6.599-15-15s6.599-15 15-15h30c8.401 0 15 6.599 15 15s-6.599 15-15 15zm0-180h-30c-8.401 0-15-6.599-15-15s6.599-15 15-15h30c8.401 0 15 6.599 15 15s-6.599 15-15 15z" />
                    <path d="M15 331h196v60h-75c-8.291 0-15 6.709-15 15s6.709 15 15 15h135v-30h-30v-60h30V166c0-24.814 20.186-45 45-45h135V46c0-8.284-6.716-15-15-15H15C6.716 31 0 37.716 0 46v270c0 8.284 6.716 15 15 15z" />
                  </svg>
                  UI/UX
                </a>
                <a href="#" className="flex items-center text-white hover:bg-gray-800 p-2 rounded-lg">
                  <svg viewBox="0 0 512 512" className="w-5 h-5 mr-2" fill="currentColor">
                    <path d="M0 331v112.295a14.996 14.996 0 007.559 13.023L106 512V391L0 331zM136 391v121l105-60V331zM271 331v121l105 60V391zM406 391v121l98.441-55.682A14.995 14.995 0 00512 443.296V331l-106 60zM391 241l-115.754 57.876L391 365.026l116.754-66.15zM262.709 1.583a15.006 15.006 0 00-13.418 0L140.246 57.876 256 124.026l115.754-66.151L262.709 1.583zM136 90v124.955l105 52.5V150zM121 241L4.246 298.876 121 365.026l115.754-66.15zM271 150v117.455l105-52.5V90z" />
                  </svg>
                  3D/AR
                </a>
              </div>
            </div>
            <div className="side-wrapper">
              <div className="side-title text-gray-400 mb-4">Fonts</div>
              <div className="side-menu flex flex-col space-y-2">
                <a href="#" className="flex items-center text-white hover:bg-gray-800 p-2 rounded-lg">
                  <svg viewBox="0 0 332 332" className="w-5 h-5 mr-2" fill="currentColor">
                    <path d="M282.341 8.283C275.765 2.705 266.211 0 253.103 0c-18.951 0-36.359 5.634-51.756 16.743-14.972 10.794-29.274 28.637-42.482 53.028-4.358 7.993-7.428 11.041-8.973 12.179h-26.255c-10.84 0-19.626 8.786-19.626 19.626 0 8.989 6.077 16.486 14.323 18.809l-.05.165h.589c1.531.385 3.109.651 4.757.651h18.833l-32.688 128.001c-7.208 27.848-10.323 37.782-11.666 41.24-1.445 3.711-3.266 7.062-5.542 10.135-.42-5.39-2.637-10.143-6.508-13.854-4.264-4.079-10.109-6.136-17.364-6.136-8.227 0-15.08 2.433-20.37 7.229-5.416 4.93-8.283 11.193-8.283 18.134 0 5.157 1.701 12.712 9.828 19.348 6.139 4.97 14.845 7.382 26.621 7.382 17.096 0 32.541-4.568 45.891-13.577 13.112-8.845 24.612-22.489 34.166-40.522 9.391-17.678 18.696-45.124 28.427-83.9l18.598-73.479h30.016c10.841 0 19.625-8.785 19.625-19.625s-8.784-19.626-19.625-19.626h-19.628c6.34-21.62 14.175-37.948 23.443-48.578 2.284-2.695 5.246-5.692 8.412-7.678-1.543 3.392-2.325 6.767-2.325 10.055 0 6.164 2.409 11.714 6.909 16.03 4.484 4.336 10.167 6.54 16.888 6.54 7.085 0 13.373-2.667 18.17-7.716 4.76-5.005 7.185-11.633 7.185-19.703.017-9.079-3.554-16.899-10.302-22.618z" />
                  </svg>
                  Manage Fonts
                </a>
              </div>
            </div>
          </div>
          <div className="main-container flex-grow flex flex-col">
            <div className="main-header flex items-center border-b border-opacity-25 py-4 px-8">
              <a href="#" className="menu-link-main text-white">All Apps</a>
              <div className="header-menu flex space-x-6 ml-auto">
                <a href="#" className="main-header-link is-active text-white">Desktop</a>
                <a href="#" className="main-header-link text-gray-400">Mobile</a>
                <a href="#" className="main-header-link text-gray-400">Web</a>
              </div>
            </div>
            <div className="content-wrapper flex-grow flex flex-col bg-opacity-40 backdrop-filter backdrop-blur-lg p-8 rounded-lg mt-6">
              <div className="content-wrapper-header flex items-center justify-between bg-gradient-to-r from-pink-500 to-yellow-400 rounded-lg p-6">
                <div className="content-wrapper-context max-w-xs">
                  <h3 className="img-content flex items-center text-lg font-semibold">
                    <svg viewBox="0 0 512 512" className="w-6 h-6 mr-4">
                      <path d="M467 0H45C20.099 0 0 20.099 0 45v422c0 24.901 20.099 45 45 45h422c24.901 0 45-20.099 45-45V45c0-24.901-20.099-45-45-45z" fill="#d6355b" />
                      <path d="M512 45v422c0 24.901-20.099 45-45 45H256V0h211c24.901 0 45 20.099 45 45z" fill="#d6355b" />
                      <path d="M467 30H45c-8.401 0-15 6.599-15 15v422c0 8.401 6.599 15 15 15h422c8.401 0 15-6.599 15-15V45c0-8.401-6.599-15-15-15z" fill="#2e000a" />
                      <path d="M482 45v422c0 8.401-6.599 15-15 15H256V30h211c8.401 0 15 6.599 15 15z" fill="#2e000a" />
                      <path d="M181 391c-41.353 0-75-33.647-75-75 0-8.291 6.709-15 15-15s15 6.709 15 15c0 24.814 20.186 45 45 45s45-20.186 45-45-20.186-45-45-45c-41.353 0-75-33.647-75-75s33.647-75 75-75 75 33.647 75 75c0 8.291-6.709 15-15 15s-15-6.709-15-15c0-24.814-20.186-45-45-45s-45 20.186-45 45 20.186 45 45 45c41.353 0 75 33.647 75 75s-33.647 75-75 75z" fill="#d6355b" />
                      <path d="M391 361h-30c-8.276 0-15-6.724-15-15V211h45c8.291 0 15-6.709 15-15s-6.709-15-15-15h-45v-45c0-8.291-6.709-15-15-15s-15 6.709-15 15v45h-15c-8.291 0-15 6.709-15 15s6.709 15 15 15h15v135c0 24.814 20.186 45 45 45h30c8.291 0 15-6.709 15-15s-6.709-15-15-15z" fill="#d6355b" />
                    </svg>
                    Adobe Stock
                  </h3>
                  <div className="content-text mt-4 text-sm leading-6 text-gray-200">Grab yourself 10 free images from Adobe Stock in a 30-day free trial plan and find the perfect image, that will help you with your new project.</div>
                  <button className="content-button bg-blue-600 text-white py-2 px-6 rounded-full mt-4">Start free trial</button>
                </div>
                <img className="content-wrapper-img w-44 mt-4" src="https://assets.codepen.io/3364143/glass.png" alt="Adobe Stock" />
              </div>
              <div className="content-section mt-6">
                <div className="content-section-title text-gray-400 mb-4">Installed</div>
                <ul className="flex flex-col bg-opacity-25 backdrop-filter backdrop-blur-lg p-4 rounded-lg border border-opacity-25 space-y-2">
                  <li className="adobe-product flex items-center p-2 rounded-lg hover:bg-gray-800">
                    <div className="products flex items-center">
                      <svg viewBox="0 0 52 52" className="w-6 h-6 border border-blue-500 mr-4">
                        <g xmlns="http://www.w3.org/2000/svg">
                          <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#061e26" />
                          <path d="M12.16 39H9.28V11h9.64c2.613 0 4.553.813 5.82 2.44 1.266 1.626 1.9 3.76 1.9 6.399 0 .934-.027 1.74-.08 2.42-.054.681-.22 1.534-.5 2.561-.28 1.026-.66 1.866-1.14 2.52-.48.654-1.213 1.227-2.2 1.72-.987.494-2.16.74-3.52.74h-7.04V39zm0-12h6.68c.96 0 1.773-.187 2.44-.56.666-.374 1.153-.773 1.46-1.2.306-.427.546-1.04.72-1.84.173-.801.267-1.4.28-1.801.013-.399.02-.973.02-1.72 0-4.053-1.694-6.08-5.08-6.08h-6.52V27zM29.48 33.92l2.8-.12c.106.987.6 1.754 1.48 2.3.88.547 1.893.82 3.04.82s2.14-.26 2.98-.78c.84-.52 1.26-1.266 1.26-2.239s-.36-1.747-1.08-2.32c-.72-.573-1.6-1.026-2.64-1.36-1.04-.333-2.086-.686-3.14-1.06a7.36 7.36 0 01-2.78-1.76c-.987-.934-1.48-2.073-1.48-3.42s.54-2.601 1.62-3.761 2.833-1.739 5.26-1.739c.854 0 1.653.1 2.4.3.746.2 1.28.394 1.6.58l.48.279-.92 2.521c-.854-.666-1.974-1-3.36-1-1.387 0-2.42.26-3.1.78-.68.52-1.02 1.18-1.02 1.979 0 .88.426 1.574 1.28 2.08.853.507 1.813.934 2.88 1.28 1.066.347 2.126.733 3.18 1.16 1.053.427 1.946 1.094 2.68 2s1.1 2.106 1.1 3.6c0 1.494-.6 2.794-1.8 3.9-1.2 1.106-2.954 1.66-5.26 1.66-2.307 0-4.114-.547-5.42-1.64-1.307-1.093-1.987-2.44-2.04-4.04z" fill="#c1dbe6" />
                        </g>
                      </svg>
                      Photoshop
                    </div>
                    <span className="status flex items-center ml-auto">
                      <span className="status-circle w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Updated
                    </span>
                    <div className="button-wrapper flex items-center ml-4">
                      <button className="content-button status-button open bg-transparent border border-gray-400 text-gray-400 py-1 px-4 rounded-full">Open</button>
                      <div className="menu flex items-center ml-4">
                        <button className="dropdown relative flex items-center">
                          <ul className="absolute right-0 top-6 bg-gray-900 text-white text-sm rounded-lg py-2 px-4 shadow-md">
                            <li className="py-1"><a href="#">Go to Discover</a></li>
                            <li className="py-1"><a href="#">Learn more</a></li>
                            <li className="py-1"><a href="#">Uninstall</a></li>
                          </ul>
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="adobe-product flex items-center p-2 rounded-lg hover:bg-gray-800">
                    <div className="products flex items-center">
                      <svg viewBox="0 0 52 52" className="w-6 h-6 border border-yellow-700 mr-4">
                        <g xmlns="http://www.w3.org/2000/svg">
                          <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#261400" />
                          <path d="M30.68 39h-3.24l-2.76-9.04h-8.32L13.72 39H10.6l8.24-28h3.32l8.52 28zm-6.72-12l-3.48-11.36L17.12 27h6.84zM37.479 12.24c0 .453-.16.84-.48 1.16-.32.319-.7.479-1.14.479-.44 0-.827-.166-1.16-.5-.334-.333-.5-.713-.5-1.14s.166-.807.5-1.141c.333-.333.72-.5 1.16-.5.44 0 .82.16 1.14.48.321.322.48.709.48 1.162zM37.24 39h-2.88V18.96h2.88V39z" fill="#e6d2c0" />
                        </g>
                      </svg>
                      Illustrator
                    </div>
                    <span className="status flex items-center ml-auto">
                      <span className="status-circle w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Update Available
                    </span>
                    <div className="button-wrapper flex items-center ml-4">
                      <button className="content-button status-button bg-blue-600 text-white py-1 px-4 rounded-full">Update this app</button>
                      <div className="menu flex items-center ml-4">
                        <button className="dropdown relative flex items-center">
                          <ul className="absolute right-0 top-6 bg-gray-900 text-white text-sm rounded-lg py-2 px-4 shadow-md">
                            <li className="py-1"><a href="#">Go to Discover</a></li>
                            <li className="py-1"><a href="#">Learn more</a></li>
                            <li className="py-1"><a href="#">Uninstall</a></li>
                          </ul>
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="adobe-product flex items-center p-2 rounded-lg hover:bg-gray-800">
                    <div className="products flex items-center">
                      <svg viewBox="0 0 52 52" className="w-6 h-6 border border-purple-500 mr-4">
                        <g xmlns="http://www.w3.org/2000/svg">
                          <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#3a3375" />
                          <path d="M27.44 39H24.2l-2.76-9.04h-8.32L10.48 39H7.36l8.24-28h3.32l8.52 28zm-6.72-12l-3.48-11.36L13.88 27h6.84zM31.48 33.48c0 2.267 1.333 3.399 4 3.399 1.653 0 3.466-.546 5.44-1.64L42 37.6c-2.054 1.254-4.2 1.881-6.44 1.881-4.64 0-6.96-1.946-6.96-5.841v-8.2c0-2.16.673-3.841 2.02-5.04 1.346-1.2 3.126-1.801 5.34-1.801s3.94.594 5.18 1.78c1.24 1.187 1.86 2.834 1.86 4.94V30.8l-11.52.6v2.08zm8.6-5.24v-3.08c0-1.413-.44-2.42-1.32-3.021-.88-.6-1.907-.899-3.08-.899-1.174 0-2.167.359-2.98 1.08-.814.72-1.22 1.773-1.22 3.16v3.199l8.6-.439z" fill="#e4d1eb" />
                        </g>
                      </svg>
                      After Effects
                    </div>
                    <span className="status flex items-center ml-auto">
                      <span className="status-circle w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      Updated
                    </span>
                    <div className="button-wrapper flex items-center ml-4">
                      <button className="content-button status-button open bg-transparent border border-gray-400 text-gray-400 py-1 px-4 rounded-full">Open</button>
                      <div className="menu flex items-center ml-4">
                        <button className="dropdown relative flex items-center">
                          <ul className="absolute right-0 top-6 bg-gray-900 text-white text-sm rounded-lg py-2 px-4 shadow-md">
                            <li className="py-1"><a href="#">Go to Discover</a></li>
                            <li className="py-1"><a href="#">Learn more</a></li>
                            <li className="py-1"><a href="#">Uninstall</a></li>
                          </ul>
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="content-section mt-6">
                <div className="content-section-title text-gray-400 mb-4">Apps in your plan</div>
                <div className="apps-card flex flex-wrap">
                  <div className="app-card flex flex-col w-1/3 p-4 bg-opacity-25 backdrop-filter backdrop-blur-lg border border-opacity-25 rounded-lg m-2 hover:scale-105 transform transition duration-300">
                    <span className="flex items-center text-lg">
                      <svg viewBox="0 0 512 512" className="w-6 h-6 border border-purple-500 mr-4">
                        <path xmlns="http://www.w3.org/2000/svg" d="M480 0H32C14.368 0 0 14.368 0 32v448c0 17.664 14.368 32 32 32h448c17.664 0 32-14.336 32-32V32c0-17.632-14.336-32-32-32z" fill="#210027" />
                        <g xmlns="http://www.w3.org/2000/svg">
                          <path d="M192 64h-80c-8.832 0-16 7.168-16 16v352c0 8.832 7.168 16 16 16s16-7.168 16-16V256h64c52.928 0 96-43.072 96-96s-43.072-96-96-96zm0 160h-64V96h64c35.296 0 64 28.704 64 64s-28.704 64-64 64zM400 256h-32c-18.08 0-34.592 6.24-48 16.384V272c0-8.864-7.168-16-16-16s-16 7.136-16 16v160c0 8.832 7.168 16 16 16s16-7.168 16-16v-96c0-26.464 21.536-48 48-48h32c8.832 0 16-7.168 16-16s-7.168-16-16-16z" fill="#f6e7fa" />
                        </g>
                      </svg>
                      Premiere Pro
                    </span>
                    <div className="app-card__subtext text-sm mt-4">Edit, master and create fully professional videos</div>
                    <div className="app-card-buttons flex items-center mt-auto">
                      <button className="content-button status-button bg-blue-600 text-white py-1 px-4 rounded-full">Update</button>
                    </div>
                  </div>
                  <div className="app-card flex flex-col w-1/3 p-4 bg-opacity-25 backdrop-filter backdrop-blur-lg border border-opacity-25 rounded-lg m-2 hover:scale-105 transform transition duration-300">
                    <span className="flex items-center text-lg">
                      <svg viewBox="0 0 52 52" className="w-6 h-6 border border-pink-500 mr-4">
                        <g xmlns="http://www.w3.org/2000/svg">
                          <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#2f0015" />
                          <path d="M18.08 39H15.2V13.72l-2.64-.08V11h5.52v28zM27.68 19.4c1.173-.507 2.593-.761 4.26-.761s3.073.374 4.22 1.12V11h2.88v28c-2.293.32-4.414.48-6.36.48-1.947 0-3.707-.4-5.28-1.2-2.08-1.066-3.12-2.92-3.12-5.561v-7.56c0-2.799 1.133-4.719 3.4-5.759zm8.48 3.12c-1.387-.746-2.907-1.119-4.56-1.119-1.574 0-2.714.406-3.42 1.22-.707.813-1.06 1.847-1.06 3.1v7.12c0 1.227.44 2.188 1.32 2.88.96.719 2.146 1.079 3.56 1.079 1.413 0 2.8-.106 4.16-.319V22.52z" fill="#e1c1cf" />
                        </g>
                      </svg>
                      InDesign
                    </span>
                    <div className="app-card__subtext text-sm mt-4">Design and publish great projects & mockups</div>
                    <div className="app-card-buttons flex items-center mt-auto">
                      <button className="content-button status-button bg-blue-600 text-white py-1 px-4 rounded-full">Update</button>
                    </div>
                  </div>
                  <div className="app-card flex flex-col w-1/3 p-4 bg-opacity-25 backdrop-filter backdrop-blur-lg border border-opacity-25 rounded-lg m-2 hover:scale-105 transform transition duration-300">
                    <span className="flex items-center text-lg">
                      <svg viewBox="0 0 52 52" className="w-6 h-6 border border-purple-500 mr-4">
                        <g xmlns="http://www.w3.org/2000/svg">
                          <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#3a3375" />
                          <path d="M27.44 39H24.2l-2.76-9.04h-8.32L10.48 39H7.36l8.24-28h3.32l8.52 28zm-6.72-12l-3.48-11.36L13.88 27h6.84zM31.48 33.48c0 2.267 1.333 3.399 4 3.399 1.653 0 3.466-.546 5.44-1.64L42 37.6c-2.054 1.254-4.2 1.881-6.44 1.881-4.64 0-6.96-1.946-6.96-5.841v-8.2c0-2.16.673-3.841 2.02-5.04 1.346-1.2 3.126-1.801 5.34-1.801s3.94.594 5.18 1.78c1.24 1.187 1.86 2.834 1.86 4.94V30.8l-11.52.6v2.08zm8.6-5.24v-3.08c0-1.413-.44-2.42-1.32-3.021-.88-.6-1.907-.899-3.08-.899-1.174 0-2.167.359-2.98 1.08-.814.72-1.22 1.773-1.22 3.16v3.199l8.6-.439z" fill="#e4d1eb" />
                        </g>
                      </svg>
                      After Effects
                    </span>
                    <div className="app-card__subtext text-sm mt-4">Industry Standard motion graphics & visual effects</div>
                    <div className="app-card-buttons flex items-center mt-auto">
                      <button className="content-button status-button bg-blue-600 text-white py-1 px-4 rounded-full">Update</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="overlay-app fixed inset-0 bg-opacity-75 bg-black z-10"></div>
      </div>
    
    </Modal>
  );
};

export default DashboardModal;
