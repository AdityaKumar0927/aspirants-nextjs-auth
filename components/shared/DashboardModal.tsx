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
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background container */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600"></div>

      {/* Main container with glassmorphism effect */}
      <div className="relative z-10 flex flex-col items-center max-w-6xl w-full h-4/5 bg-opacity-40 bg-white backdrop-filter backdrop-blur-lg border border-opacity-25 border-white rounded-lg p-8">
        {/* Header */}
        <div className="header flex items-center w-full h-14 border-b border-gray-200 px-4">
          <div className="menu-circle w-3 h-3 bg-red-500 rounded-full mr-4"></div>
          <div className="header-menu flex space-x-6">
            <a className="menu-link is-active text-white" href="#">Apps</a>
            <a className="menu-link text-gray-300" href="#">Your work</a>
            <a className="menu-link text-gray-300" href="#">Discover</a>
            <a className="menu-link text-gray-300" href="#">Market</a>
          </div>
          <div className="search-bar ml-auto flex items-center">
            <input
              type="text"
              placeholder="Search"
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-gray-900 text-white"
            />
          </div>
          <div className="header-profile ml-4 flex items-center">
            <div className="notification relative mr-4">
              <span className="notification-number absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <img
              className="profile-img w-8 h-8 rounded-full border-2 border-white"
              src="https://images.unsplash.com/photo-1600353068440-6361ef3a86e8?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80"
              alt=""
            />
          </div>
        </div>

        {/* Content */}
        <div className="wrapper flex flex-grow overflow-hidden mt-4">
          <div className="left-side w-60 border-r border-gray-200 p-4 overflow-auto">
            <div className="side-wrapper">
              <div className="side-title text-gray-400 mb-2">Apps</div>
              <div className="side-menu flex flex-col space-y-2">
                <a href="#" className="flex items-center text-white">
                  <svg viewBox="0 0 512 512" className="w-4 h-4 mr-2">
                    <g fill="currentColor">
                      <path d="M0 0h128v128H0zm0 0M192 0h128v128H192zm0 0M384 0h128v128H384zm0 0M0 192h128v128H0zm0 0" />
                    </g>
                    <path d="M192 192h128v128H192zm0 0M384 192h128v128H384zm0 0M0 384h128v128H0zm0 0M192 384h128v128H192zm0 0M384 384h128v128H384zm0 0" fill="currentColor" />
                  </svg>
                  All Apps
                </a>
                <a href="#" className="flex items-center text-white">
                  <svg viewBox="0 0 488.932 488.932" fill="currentColor" className="w-4 h-4 mr-2">
                    <path d="M243.158 61.361v-57.6c0-3.2 4-4.9 6.7-2.9l118.4 87c2 1.5 2 4.4 0 5.9l-118.4 87c-2.7 2-6.7.2-6.7-2.9v-57.5c-87.8 1.4-158.1 76-152.1 165.4 5.1 76.8 67.7 139.1 144.5 144 81.4 5.2 150.6-53 163-129.9 2.3-14.3 14.7-24.7 29.2-24.7 17.9 0 31.8 15.9 29 33.5-17.4 109.7-118.5 192-235.7 178.9-98-11-176.7-89.4-187.8-187.4-14.7-128.2 84.9-237.4 209.9-238.8z" />
                  </svg>
                  Updates
                  <span className="notification-number updates ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
                </a>
              </div>
            </div>
          </div>
          <div className="main-container flex-grow p-4 overflow-auto">
            <div className="main-header flex items-center border-b border-gray-200 pb-2 mb-4">
              <a className="menu-link-main text-white mr-4" href="#">All Apps</a>
              <div className="header-menu flex space-x-4">
                <a className="main-header-link is-active text-white" href="#">Desktop</a>
                <a className="main-header-link text-gray-300" href="#">Mobile</a>
                <a className="main-header-link text-gray-300" href="#">Web</a>
              </div>
            </div>
            <div className="content-wrapper flex-grow">
              <div className="content-wrapper-header flex items-center justify-between bg-gradient-to-r from-purple-400 to-blue-600 rounded-lg p-6 text-white">
                <div className="content-wrapper-context max-w-lg">
                  <h3 className="img-content flex items-center text-xl font-semibold">
                    <svg viewBox="0 0 512 512" className="w-6 h-6 mr-4">
                      <path d="M467 0H45C20.099 0 0 20.099 0 45v422c0 24.901 20.099 45 45 45h422c24.901 0 45-20.099 45-45V45c0-24.901-20.099-45-45-45z" fill="#d6355b" />
                      <path d="M512 45v422c0 24.901-20.099 45-45 45H256V0h211c24.901 0 45 20.099 45 45z" fill="#d6355b" />
                      <path d="M467 30H45c-8.401 0-15 6.599-15 15v422c0 8.401 6.599 15 15 15h422c8.401 0 15-6.599 15-15V45c0-8.401-6.599-15-15-15z" fill="#2e000a" />
                      <path d="M482 45v422c0 8.401-6.599 15-15 15H256V30h211c8.401 0 15 6.599 15 15z" fill="#2e000a" />
                      <path d="M181 391c-41.353 0-75-33.647-75-75 0-8.291 6.709-15 15-15s15 6.709 15 15c0 24.814 20.186 45 45 45s45-20.186 45-45-20.186-45-45-45c-41.353 0-75-33.647-75-75s33.647-75 75-75 75 33.647 75 75c0 8.291-6.709 15-15 15s-15-6.709-15-15c0-24.814-20.186-45-45-45s-45 20.186-45 45 20.186 45 45 45c41.353 0 75 33.647 75 75s-33.647 75-75 75z" fill="#d6355b" />
                      <path d="M391 361h-30c-8.276 0-15-6.724-15-15V211h45c8.291 0 15-6.709 15-15s-6.709-15-15-15h-45v-45c0-8.291-6.709-15-15-15s-15 6.709-15 15v45h-15c-8.291 0-15 6.709-15 15s6.709 15 15 15h15v135c0 24.814 20.186 45 45 45h30c8.291 0 15-6.709 15-15s-7.168-15-15-15z" fill="#d6355b" />
                    </svg>
                    Adobe Stock
                  </h3>
                  <div className="content-text mt-2 text-sm">
                    Grab yourself 10 free images from Adobe Stock in a 30-day free trial plan and find the perfect image that will help you with your new project.
                  </div>
                  <button className="content-button mt-4 bg-blue-600 text-white py-1 px-4 rounded-full">Start free trial</button>
                </div>
                <img
                  className="content-wrapper-img w-48"
                  src="https://assets.codepen.io/3364143/glass.png"
                  alt=""
                />
              </div>
              <div className="content-section mt-8">
                <div className="content-section-title text-gray-400 mb-4">Installed</div>
                <ul className="flex flex-col space-y-2 bg-opacity-40 bg-white p-4 rounded-lg">
                  <li className="adobe-product flex items-center p-4 bg-opacity-40 bg-white rounded-lg">
                    <div className="products flex items-center space-x-4">
                      <svg viewBox="0 0 52 52" className="w-6 h-6" style={{ border: '1px solid #3291b8' }}>
                        <g fill="currentColor">
                          <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#061e26" />
                          <path d="M12.16 39H9.28V11h9.64c2.613 0 4.553.813 5.82 2.44 1.266 1.626 1.9 3.76 1.9 6.399 0 .934-.027 1.74-.08 2.42-.054.681-.22 1.534-.5 2.561-.28 1.026-.66 1.866-1.14 2.52-.48.654-1.213 1.227-2.2 1.72-.987.494-2.16.74-3.52.74h-7.04V39zm0-12h6.68c.96 0 1.773-.187 2.44-.56.666-.374 1.153-.773 1.46-1.2.306-.427.546-1.04.72-1.84.173-.801.267-1.4.28-1.801.013-.399.02-.973.02-1.72 0-4.053-1.694-6.08-5.08-6.08h-6.52V27zM29.48 33.92l2.8-.12c.106.987.6 1.754 1.48 2.3.88.547 1.893.82 3.04.82s2.14-.26 2.98-.78c.84-.52 1.26-1.266 1.26-2.239s-.36-1.747-1.08-2.32c-.72-.573-1.6-1.026-2.64-1.36-1.04-.333-2.086-.686-3.14-1.06a7.36 7.36 0 01-2.78-1.76c-.987-.934-1.48-2.073-1.48-3.42s.54-2.601 1.62-3.761 2.833-1.739 5.26-1.739c.854 0 1.653.1 2.4.3.746.2 1.28.394 1.6.58l.48.279-.92 2.521c-.854-.666-1.974-1-3.36-1-1.387 0-2.42.26-3.1.78-.68.52-1.02 1.18-1.02 1.979 0 .88.426 1.574 1.28 2.08.853.507 1.813.934 2.88 1.28 1.066.347 2.126.733 3.18 1.16 1.053.427 1.946 1.094 2.68 2s1.1 2.106 1.1 3.6c0 1.494-.6 2.794-1.8 3.9-1.2 1.106-2.954 1.66-5.26 1.66-2.307 0-4.114-.547-5.42-1.64-1.307-1.093-1.987-2.44-2.04-4.04z" fill="#c1dbe6" />
                        </g>
                      </svg>
                      <span className="text-white">Photoshop</span>
                    </div>
                    <span className="status flex items-center ml-auto">
                      <span className="status-circle bg-green-500 w-2 h-2 rounded-full mr-2"></span>
                      Updated
                    </span>
                    <div className="button-wrapper flex items-center ml-4">
                      <button className="content-button status-button open bg-transparent border border-gray-300 text-gray-300 py-1 px-4 rounded-full mr-2">Open</button>
                      <div className="menu relative">
                        <button className="dropdown bg-transparent border-none p-0">
                          <ul className="absolute right-0 top-6 bg-gray-800 text-white rounded-lg shadow-lg p-2 space-y-2">
                            <li><a href="#" className="block px-2 py-1">Go to Discover</a></li>
                            <li><a href="#" className="block px-2 py-1">Learn more</a></li>
                            <li><a href="#" className="block px-2 py-1">Uninstall</a></li>
                          </ul>
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="adobe-product flex items-center p-4 bg-opacity-40 bg-white rounded-lg">
                    <div className="products flex items-center space-x-4">
                      <svg viewBox="0 0 52 52" className="w-6 h-6" style={{ border: '1px solid #b65a0b' }}>
                        <g fill="currentColor">
                          <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#261400" />
                          <path d="M30.68 39h-3.24l-2.76-9.04h-8.32L13.72 39H10.6l8.24-28h3.32l8.52 28zm-6.72-12l-3.48-11.36L17.12 27h6.84zM37.479 12.24c0 .453-.16.84-.48 1.16-.32.319-.7.479-1.14.479-.44 0-.827-.166-1.16-.5-.334-.333-.5-.713-.5-1.14s.166-.807.5-1.141c.333-.333.72-.5 1.16-.5.44 0 .82.16 1.14.48.321.322.48.709.48 1.162zM37.24 39h-2.88V18.96h2.88V39z" fill="#e6d2c0" />
                        </g>
                      </svg>
                      <span className="text-white">Illustrator</span>
                    </div>
                    <span className="status flex items-center ml-auto">
                      <span className="status-circle w-2 h-2 rounded-full mr-2"></span>
                      Update Available
                    </span>
                    <div className="button-wrapper flex items-center ml-4">
                      <button className="content-button status-button bg-blue-600 text-white py-1 px-4 rounded-full mr-2">Update this app</button>
                      <div className="pop-up relative">
                        <div className="pop-up__title flex items-center justify-between border-b border-gray-300 pb-2 mb-2">
                          Update This App
                          <svg className="close w-6 h-6 text-gray-300 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M15 9l-6 6M9 9l6 6" />
                          </svg>
                        </div>
                        <div className="pop-up__subtitle text-gray-400 mb-4">
                          Adjust your selections for advanced options as desired before continuing. <a href="#" className="text-blue-600">Learn more</a>
                        </div>
                        <div className="checkbox-wrapper flex items-center mb-2">
                          <input type="checkbox" id="check1" className="checkbox hidden" />
                          <label htmlFor="check1" className="text-white">Import previous settings and preferences</label>
                        </div>
                        <div className="checkbox-wrapper flex items-center mb-4">
                          <input type="checkbox" id="check2" className="checkbox hidden" />
                          <label htmlFor="check2" className="text-white">Remove old versions</label>
                        </div>
                        <div className="content-button-wrapper flex justify-end">
                          <button className="content-button status-button open close bg-gray-700 text-white py-1 px-4 rounded-full mr-2">Cancel</button>
                          <button className="content-button status-button bg-blue-600 text-white py-1 px-4 rounded-full">Continue</button>
                        </div>
                      </div>
                      <div className="menu relative">
                        <button className="dropdown bg-transparent border-none p-0">
                          <ul className="absolute right-0 top-6 bg-gray-800 text-white rounded-lg shadow-lg p-2 space-y-2">
                            <li><a href="#" className="block px-2 py-1">Go to Discover</a></li>
                            <li><a href="#" className="block px-2 py-1">Learn more</a></li>
                            <li><a href="#" className="block px-2 py-1">Uninstall</a></li>
                          </ul>
                        </button>
                      </div>
                    </div>
                  </li>
                  <li className="adobe-product flex items-center p-4 bg-opacity-40 bg-white rounded-lg">
                    <div className="products flex items-center space-x-4">
                      <svg viewBox="0 0 52 52" className="w-6 h-6" style={{ border: '1px solid #C75DEB' }}>
                        <g fill="currentColor">
                          <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#3a3375" />
                          <path d="M27.44 39H24.2l-2.76-9.04h-8.32L10.48 39H7.36l8.24-28h3.32l8.52 28zm-6.72-12l-3.48-11.36L13.88 27h6.84zM31.48 33.48c0 2.267 1.333 3.399 4 3.399 1.653 0 3.466-.546 5.44-1.64L42 37.6c-2.054 1.254-4.2 1.881-6.44 1.881-4.64 0-6.96-1.946-6.96-5.841v-8.2c0-2.16.673-3.841 2.02-5.04 1.346-1.2 3.126-1.801 5.34-1.801s3.94.594 5.18 1.78c1.24 1.187 1.86 2.834 1.86 4.94V30.8l-11.52.6v2.08zm8.6-5.24v-3.08c0-1.413-.44-2.42-1.32-3.021-.88-.6-1.907-.899-3.08-.899-1.174 0-2.167.359-2.98 1.08-.814.72-1.22 1.773-1.22 3.16v3.199l8.6-.439z" fill="#e4d1eb" />
                        </g>
                      </svg>
                      <span className="text-white">After Effects</span>
                    </div>
                    <span className="status flex items-center ml-auto">
                      <span className="status-circle bg-green-500 w-2 h-2 rounded-full mr-2"></span>
                      Updated
                    </span>
                    <div className="button-wrapper flex items-center ml-4">
                      <button className="content-button status-button open bg-transparent border border-gray-300 text-gray-300 py-1 px-4 rounded-full mr-2">Open</button>
                      <div className="menu relative">
                        <button className="dropdown bg-transparent border-none p-0">
                          <ul className="absolute right-0 top-6 bg-gray-800 text-white rounded-lg shadow-lg p-2 space-y-2">
                            <li><a href="#" className="block px-2 py-1">Go to Discover</a></li>
                            <li><a href="#" className="block px-2 py-1">Learn more</a></li>
                            <li><a href="#" className="block px-2 py-1">Uninstall</a></li>
                          </ul>
                        </button>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="content-section mt-8">
                <div className="content-section-title text-gray-400 mb-4">Apps in your plan</div>
                <div className="apps-card flex flex-wrap -mx-4">
                  <div className="app-card w-1/3 p-4">
                    <div className="flex flex-col bg-opacity-40 bg-white rounded-lg p-4">
                      <span className="flex items-center space-x-4">
                        <svg viewBox="0 0 512 512" className="w-6 h-6" style={{ border: '1px solid #a059a9' }}>
                          <path d="M480 0H32C14.368 0 0 14.368 0 32v448c0 17.664 14.368 32 32 32h448c17.664 0 32-14.336 32-32V32c0-17.632-14.336-32-32-32z" fill="#210027" />
                          <path d="M192 64h-80c-8.832 0-16 7.168-16 16v352c0 8.832 7.168 16 16 16s16-7.168 16-16V256h64c52.928 0 96-43.072 96-96s-43.072-96-96-96zm0 160h-64V96h64c35.296 0 64 28.704 64 64s-28.704 64-64 64zM400 256h-32c-18.08 0-34.592 6.24-48 16.384V272c0-8.864-7.168-16-16-16s-16 7.136-16 16v160c0 8.832 7.168 16 16 16s16-7.168 16-16v-96c0-26.464 21.536-48 48-48h32c8.832 0 16-7.168 16-16s-7.168-16-16-16z" fill="#f6e7fa" />
                        </svg>
                        <span className="text-white">Premiere Pro</span>
                      </span>
                      <div className="app-card__subtext text-sm text-gray-300 mt-4 border-b border-gray-200 pb-4">
                        Edit, master and create fully professional videos
                      </div>
                      <div className="app-card-buttons flex items-center mt-4">
                        <button className="content-button status-button bg-blue-600 text-white py-1 px-4 rounded-full">Update</button>
                      </div>
                    </div>
                  </div>
                  <div className="app-card w-1/3 p-4">
                    <div className="flex flex-col bg-opacity-40 bg-white rounded-lg p-4">
                      <span className="flex items-center space-x-4">
                        <svg viewBox="0 0 52 52" className="w-6 h-6" style={{ border: '1px solid #c1316d' }}>
                          <g fill="currentColor">
                            <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#2f0015" />
                            <path d="M18.08 39H15.2V13.72l-2.64-.08V11h5.52v28zM27.68 19.4c1.173-.507 2.593-.761 4.26-.761s3.073.374 4.22 1.12V11h2.88v28c-2.293.32-4.414.48-6.36.48-1.947 0-3.707-.4-5.28-1.2-2.08-1.066-3.12-2.92-3.12-5.561v-7.56c0-2.799 1.133-4.719 3.4-5.759zm8.48 3.12c-1.387-.746-2.907-1.119-4.56-1.119-1.574 0-2.714.406-3.42 1.22-.707.813-1.06 1.847-1.06 3.1v7.12c0 1.227.44 2.188 1.32 2.88.96.719 2.146 1.079 3.56 1.079 1.413 0 2.8-.106 4.16-.319V22.52z" fill="#e1c1cf" />
                          </g>
                        </svg>
                        <span className="text-white">InDesign</span>
                      </span>
                      <div className="app-card__subtext text-sm text-gray-300 mt-4 border-b border-gray-200 pb-4">
                        Design and publish great projects & mockups
                      </div>
                      <div className="app-card-buttons flex items-center mt-4">
                        <button className="content-button status-button bg-blue-600 text-white py-1 px-4 rounded-full">Update</button>
                      </div>
                    </div>
                  </div>
                  <div className="app-card w-1/3 p-4">
                    <div className="flex flex-col bg-opacity-40 bg-white rounded-lg p-4">
                      <span className="flex items-center space-x-4">
                        <svg viewBox="0 0 52 52" className="w-6 h-6" style={{ border: '1px solid #C75DEB' }}>
                          <g fill="currentColor">
                            <path d="M40.824 52H11.176C5.003 52 0 46.997 0 40.824V11.176C0 5.003 5.003 0 11.176 0h29.649C46.997 0 52 5.003 52 11.176v29.649C52 46.997 46.997 52 40.824 52z" fill="#3a3375" />
                            <path d="M27.44 39H24.2l-2.76-9.04h-8.32L10.48 39H7.36l8.24-28h3.32l8.52 28zm-6.72-12l-3.48-11.36L13.88 27h6.84zM31.48 33.48c0 2.267 1.333 3.399 4 3.399 1.653 0 3.466-.546 5.44-1.64L42 37.6c-2.054 1.254-4.2 1.881-6.44 1.881-4.64 0-6.96-1.946-6.96-5.841v-8.2c0-2.16.673-3.841 2.02-5.04 1.346-1.2 3.126-1.801 5.34-1.801s3.94.594 5.18 1.78c1.24 1.187 1.86 2.834 1.86 4.94V30.8l-11.52.6v2.08zm8.6-5.24v-3.08c0-1.413-.44-2.42-1.32-3.021-.88-.6-1.907-.899-3.08-.899-1.174 0-2.167.359-2.98 1.08-.814.72-1.22 1.773-1.22 3.16v3.199l8.6-.439z" fill="#e4d1eb" />
                          </g>
                        </svg>
                        <span className="text-white">After Effects</span>
                      </span>
                      <div className="app-card__subtext text-sm text-gray-300 mt-4 border-b border-gray-200 pb-4">
                        Industry Standard motion graphics & visual effects
                      </div>
                      <div className="app-card-buttons flex items-center mt-4">
                        <button className="content-button status-button bg-blue-600 text-white py-1 px-4 rounded-full">Update</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dark/Light mode toggle */}
      <div className="dark-light fixed bottom-12 right-8 bg-gray-800 p-2 rounded-full cursor-pointer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      </div>
    </div>
    </Modal>
  );
};

export default DashboardModal;
