import React, { useState } from 'react';
import Navbar from '../Components/Navbar';

const Landing = ({ onShowLogin, onShowSignup, isAuthenticated, onLogout }) => {

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navbar 
        onShowLogin={onShowLogin}
        onShowSignup={onShowSignup}
        isAuthenticated={isAuthenticated}
        onLogout={onLogout}
      />

      {/* Hero Section */}
      <section id="home" className="py-20 ag-hero-gradient">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="text-center lg:text-left lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--ag-primary-50)] text-[var(--ag-primary-600)] text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-[var(--ag-primary-600)]"></span>
                Grow smarter with AI
              </div>
              <h1 className="ag-display text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Farming that is productive, sustainable, and data-driven
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0">
                Get accurate crop recommendations, monitor soil and weather, and make confident decisions every season.
              </p>
              {!isAuthenticated && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button 
                    onClick={onShowSignup}
                    className="ag-cta-gradient text-white px-8 py-4 rounded-xl hover:opacity-95 transition-opacity font-semibold shadow-lg"
                  >
                    Start Free Trial
                  </button>
                  <button className="border-2 border-[var(--ag-primary-600)] text-[var(--ag-primary-600)] px-8 py-4 rounded-xl hover:bg-[var(--ag-primary-50)] transition-colors font-semibold">
                    Watch Demo
                  </button>
                </div>
              )}
              <div className="flex items-center gap-6 text-sm text-gray-600 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--ag-primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  No hardware needed
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--ag-primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  Works on mobile
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--ag-primary-600)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  24/7 support
                </div>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="ag-card p-6 md:p-8 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-[var(--ag-field-200)] blur-2xl opacity-60"></div>
                <div className="relative">
                  <div className="rounded-xl h-48 md:h-64 ag-cta-gradient flex items-center justify-center text-white">
                    <svg className="w-24 h-24 opacity-95" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 42c10-4 20-4 32 0 8 3 12-2 20-4-4 10-12 16-24 18C20 58 10 52 6 42Z" fill="rgba(255,255,255,0.25)"/>
                      <path d="M12 34c8-3 16-3 26 0M14 28c6-2 12-2 20 0M18 22c5-1 9-1 14 0" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M40 28c2 0 4-3 6-6s4-6 6-6" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-[var(--ag-primary-50)] rounded-lg p-3 text-center">
                      <div className="ag-display text-2xl text-[var(--ag-primary-600)]">25%</div>
                      <div className="text-gray-600 text-sm">Yield</div>
                    </div>
                    <div className="bg-[var(--ag-primary-50)] rounded-lg p-3 text-center">
                      <div className="ag-display text-2xl text-[var(--ag-primary-600)]">-30%</div>
                      <div className="text-gray-600 text-sm">Costs</div>
                    </div>
                    <div className="bg-[var(--ag-primary-50)] rounded-lg p-3 text-center">
                      <div className="ag-display text-2xl text-[var(--ag-primary-600)]">90%</div>
                      <div className="text-gray-600 text-sm">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="ag-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Smart Farming
            </h2>
            <p className="text-xl text-gray-600">
              Powerful tools to optimize your agricultural operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow ag-card">
              <div className="w-16 h-16 bg-[var(--ag-primary-50)] text-[var(--ag-primary-600)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Crop Monitoring</h3>
              <p className="text-gray-600">Real-time monitoring of crop health using AI analysis</p>
            </div>

            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow ag-card">
              <div className="w-16 h-16 bg-[var(--ag-primary-50)] text-[var(--ag-primary-600)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Weather Intelligence</h3>
              <p className="text-gray-600">Advanced weather forecasting for better planning</p>
            </div>

            <div className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow ag-card">
              <div className="w-16 h-16 bg-[var(--ag-primary-50)] text-[var(--ag-primary-600)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Yield Prediction</h3>
              <p className="text-gray-600">AI-powered yield forecasting and optimization</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="ag-display text-3xl md:text-4xl font-bold text-gray-900">How it works</h2>
            <p className="text-gray-600 mt-3">Three simple steps to smarter farming</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="ag-card p-6">
              <div className="w-10 h-10 rounded-lg ag-cta-gradient text-white flex items-center justify-center mb-4">
                <span className="ag-display">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create your farm</h3>
              <p className="text-gray-600">Add your crops, field size, and location to get tailored insights.</p>
            </div>
            <div className="ag-card p-6">
              <div className="w-10 h-10 rounded-lg ag-cta-gradient text-white flex items-center justify-center mb-4">
                <span className="ag-display">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Track conditions</h3>
              <p className="text-gray-600">We analyze weather and soil factors to monitor crop health.</p>
            </div>
            <div className="ag-card p-6">
              <div className="w-10 h-10 rounded-lg ag-cta-gradient text-white flex items-center justify-center mb-4">
                <span className="ag-display">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Act with confidence</h3>
              <p className="text-gray-600">Get recommendations on irrigation, fertilization, and harvest time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-[var(--ag-muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="ag-display text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Why Choose AgriSense?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our AI-powered platform helps farmers make smarter decisions, increase productivity, and achieve sustainable farming practices.
              </p>
              <div className="space-y-4">
                {[
                  "No hardware installation required",
                  "AI-powered recommendations",
                  "Real-time monitoring",
                  "Expert support available"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-[var(--ag-primary-600)] rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-[var(--ag-border)]">
              <div className="text-center space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Join 10,000+ Farmers</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold text-[var(--ag-primary-600)]">25%</div>
                    <div className="text-gray-600">Yield Increase</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-[var(--ag-primary-600)]">30%</div>
                    <div className="text-gray-600">Cost Reduction</div>
                  </div>
                </div>
                <button 
                  onClick={onShowSignup}
                  className="w-full ag-cta-gradient text-white py-3 rounded-lg hover:opacity-95 transition-opacity font-semibold shadow-md"
                >
                  Get Started Today
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="ag-display text-3xl md:text-4xl font-bold text-gray-900">What farmers say</h2>
            <p className="text-gray-600 mt-3">Real stories from the field</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                text: 'AgriSense helped me save water and increase my yield this season.',
                name: 'Ravi Kumar',
                role: 'Wheat farmer, Punjab'
              },
              {
                text: 'Timely alerts on weather saved an entire patch from damage.',
                name: 'Anita Devi',
                role: 'Vegetable farmer, Maharashtra'
              },
              {
                text: 'Easy to use on my phone and insights are very practical.',
                name: 'Joseph Mwangi',
                role: 'Maize farmer, Nakuru'
              }
            ].map((t, i) => (
              <div key={i} className="ag-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full ag-cta-gradient text-white flex items-center justify-center ag-display">{t.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{t.name}</div>
                    <div className="text-gray-600 text-sm">{t.role}</div>
                  </div>
                </div>
                <p className="text-gray-700">“{t.text}”</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center ag-cta-gradient">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <span className="text-xl font-bold">AgriSense</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering farmers with AI-powered agricultural intelligence
            </p>
            <p className="text-gray-500">&copy; 2024 AgriSense. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
