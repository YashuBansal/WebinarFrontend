import React, { useState, useEffect } from "react";
import Select from "react-select";

// Helper function to clean up phone number (remove non-digits)
const cleanPhoneNumber = (phone) => {
  if (!phone) return "";
  // Remove all non-digit characters from the phone number
  return phone.replace(/\D/g, "");
};

// NEW Helper function to format phone numbers for display in the dropdown
// This applies the specific rules: remove '91' if 12 chars, remove '0' if 11 chars
const formatPhoneNumberForDisplay = (phone) => {
  let cleaned = cleanPhoneNumber(phone); // Always start with a clean (digits-only) number

  // Rule 1: if a phone length is 12 and starts with '91' then remove '91'
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.substring(2); // Remove the first two characters ('91')
  }

  // Rule 2: if a phone length is 11 and starts with '0' then remove '0'
  // Note: This rule applies *after* checking for the '91' rule.
  // If a number was "910123456789" (12 chars), it would become "0123456789" (10 chars)
  // after the first rule, so the second rule (11 chars) wouldn't apply.
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.substring(1); // Remove the first character ('0')
  }

  // If no specific rules apply, return the cleaned number as is
  return cleaned;
};

// A list of common country codes. You can expand this as needed.
const countryCodes = [
  { name: "Afghanistan (+93)", code: "93" },
  { name: "Albania (+355)", code: "355" },
  { name: "Algeria (+213)", code: "213" },
  { name: "Andorra (+376)", code: "376" },
  { name: "Angola (+244)", code: "244" },
  { name: "Argentina (+54)", code: "54" },
  { name: "Armenia (+374)", code: "374" },
  { name: "Australia (+61)", code: "61" },
  { name: "Austria (+43)", code: "43" },
  { name: "Azerbaijan (+994)", code: "994" },
  { name: "Bahamas (+1)", code: "1" },
  { name: "Bahrain (+973)", code: "973" },
  { name: "Bangladesh (+880)", code: "880" },
  { name: "Barbados (+1)", code: "1" },
  { name: "Belarus (+375)", code: "375" },
  { name: "Belgium (+32)", code: "32" },
  { name: "Belize (+501)", code: "501" },
  { name: "Benin (+229)", code: "229" },
  { name: "Bhutan (+975)", code: "975" },
  { name: "Bolivia (+591)", code: "591" },
  { name: "Bosnia and Herzegovina (+387)", code: "387" },
  { name: "Botswana (+267)", code: "267" },
  { name: "Brazil (+55)", code: "55" },
  { name: "Brunei (+673)", code: "673" },
  { name: "Bulgaria (+359)", code: "359" },
  { name: "Burkina Faso (+226)", code: "226" },
  { name: "Burundi (+257)", code: "257" },
  { name: "Cambodia (+855)", code: "855" },
  { name: "Cameroon (+237)", code: "237" },
  { name: "Canada (+1)", code: "1" },
  { name: "Cape Verde (+238)", code: "238" },
  { name: "Central African Republic (+236)", code: "236" },
  { name: "Chad (+235)", code: "235" },
  { name: "Chile (+56)", code: "56" },
  { name: "China (+86)", code: "86" },
  { name: "Colombia (+57)", code: "57" },
  { name: "Comoros (+269)", code: "269" },
  { name: "Congo (+242)", code: "242" },
  { name: "Costa Rica (+506)", code: "506" },
  { name: "Croatia (+385)", code: "385" },
  { name: "Cuba (+53)", code: "53" },
  { name: "Cyprus (+357)", code: "357" },
  { name: "Czech Republic (+420)", code: "420" },
  { name: "Denmark (+45)", code: "45" },
  { name: "Djibouti (+253)", code: "253" },
  { name: "Dominican Republic (+1)", code: "1" },
  { name: "Ecuador (+593)", code: "593" },
  { name: "Egypt (+20)", code: "20" },
  { name: "El Salvador (+503)", code: "503" },
  { name: "Equatorial Guinea (+240)", code: "240" },
  { name: "Eritrea (+291)", code: "291" },
  { name: "Estonia (+372)", code: "372" },
  { name: "Eswatini (+268)", code: "268" },
  { name: "Ethiopia (+251)", code: "251" },
  { name: "Fiji (+679)", code: "679" },
  { name: "Finland (+358)", code: "358" },
  { name: "France (+33)", code: "33" },
  { name: "Gabon (+241)", code: "241" },
  { name: "Gambia (+220)", code: "220" },
  { name: "Georgia (+995)", code: "995" },
  { name: "Germany (+49)", code: "49" },
  { name: "Ghana (+233)", code: "233" },
  { name: "Greece (+30)", code: "30" },
  { name: "Grenada (+1)", code: "1" },
  { name: "Guatemala (+502)", code: "502" },
  { name: "Guinea (+224)", code: "224" },
  { name: "Guyana (+592)", code: "592" },
  { name: "Haiti (+509)", code: "509" },
  { name: "Honduras (+504)", code: "504" },
  { name: "Hungary (+36)", code: "36" },
  { name: "Iceland (+354)", code: "354" },
  { name: "India (+91)", code: "91" }, // Default for India
  { name: "Indonesia (+62)", code: "62" },
  { name: "Iran (+98)", code: "98" },
  { name: "Iraq (+964)", code: "964" },
  { name: "Ireland (+353)", code: "353" },
  { name: "Israel (+972)", code: "972" },
  { name: "Italy (+39)", code: "39" },
  { name: "Jamaica (+1)", code: "1" },
  { name: "Japan (+81)", code: "81" },
  { name: "Jordan (+962)", code: "962" },
  { name: "Kazakhstan (+7)", code: "7" },
  { name: "Kenya (+254)", code: "254" },
  { name: "Kuwait (+965)", code: "965" },
  { name: "Kyrgyzstan (+996)", code: "996" },
  { name: "Laos (+856)", code: "856" },
  { name: "Latvia (+371)", code: "371" },
  { name: "Lebanon (+961)", code: "961" },
  { name: "Lesotho (+266)", code: "266" },
  { name: "Liberia (+231)", code: "231" },
  { name: "Libya (+218)", code: "218" },
  { name: "Lithuania (+370)", code: "370" },
  { name: "Luxembourg (+352)", code: "352" },
  { name: "Madagascar (+261)", code: "261" },
  { name: "Malawi (+265)", code: "265" },
  { name: "Malaysia (+60)", code: "60" },
  { name: "Maldives (+960)", code: "960" },
  { name: "Mali (+223)", code: "223" },
  { name: "Malta (+356)", code: "356" },
  { name: "Mauritania (+222)", code: "222" },
  { name: "Mauritius (+230)", code: "230" },
  { name: "Mexico (+52)", code: "52" },
  { name: "Moldova (+373)", code: "373" },
  { name: "Monaco (+377)", code: "377" },
  { name: "Mongolia (+976)", code: "976" },
  { name: "Montenegro (+382)", code: "382" },
  { name: "Morocco (+212)", code: "212" },
  { name: "Mozambique (+258)", code: "258" },
  { name: "Myanmar (+95)", code: "95" },
  { name: "Namibia (+264)", code: "264" },
  { name: "Nepal (+977)", code: "977" },
  { name: "Netherlands (+31)", code: "31" },
  { name: "New Zealand (+64)", code: "64" },
  { name: "Nicaragua (+505)", code: "505" },
  { name: "Niger (+227)", code: "227" },
  { name: "Nigeria (+234)", code: "234" },
  { name: "North Korea (+850)", code: "850" },
  { name: "Norway (+47)", code: "47" },
  { name: "Oman (+968)", code: "968" },
  { name: "Pakistan (+92)", code: "92" },
  { name: "Panama (+507)", code: "507" },
  { name: "Paraguay (+595)", code: "595" },
  { name: "Peru (+51)", code: "51" },
  { name: "Philippines (+63)", code: "63" },
  { name: "Poland (+48)", code: "48" },
  { name: "Portugal (+351)", code: "351" },
  { name: "Qatar (+974)", code: "974" },
  { name: "Romania (+40)", code: "40" },
  { name: "Russia (+7)", code: "7" },
  { name: "Rwanda (+250)", code: "250" },
  { name: "Saudi Arabia (+966)", code: "966" },
  { name: "Senegal (+221)", code: "221" },
  { name: "Serbia (+381)", code: "381" },
  { name: "Singapore (+65)", code: "65" },
  { name: "Slovakia (+421)", code: "421" },
  { name: "Slovenia (+386)", code: "386" },
  { name: "South Africa (+27)", code: "27" },
  { name: "South Korea (+82)", code: "82" },
  { name: "Spain (+34)", code: "34" },
  { name: "Sri Lanka (+94)", code: "94" },
  { name: "Sudan (+249)", code: "249" },
  { name: "Sweden (+46)", code: "46" },
  { name: "Switzerland (+41)", code: "41" },
  { name: "Syria (+963)", code: "963" },
  { name: "Taiwan (+886)", code: "886" },
  { name: "Tajikistan (+992)", code: "992" },
  { name: "Tanzania (+255)", code: "255" },
  { name: "Thailand (+66)", code: "66" },
  { name: "Tunisia (+216)", code: "216" },
  { name: "Turkey (+90)", code: "90" },
  { name: "Uganda (+256)", code: "256" },
  { name: "Ukraine (+380)", code: "380" },
  { name: "United Arab Emirates (+971)", code: "971" },
  { name: "United Kingdom (+44)", code: "44" },
  { name: "United States (+1)", code: "1" },
  { name: "Uruguay (+598)", code: "598" },
  { name: "Uzbekistan (+998)", code: "998" },
  { name: "Venezuela (+58)", code: "58" },
  { name: "Vietnam (+84)", code: "84" },
  { name: "Yemen (+967)", code: "967" },
  { name: "Zambia (+260)", code: "260" },
  { name: "Zimbabwe (+263)", code: "263" },
];

// phones - array of phone numbers strings. These will be formatted for display.
// onClose - function to close the modal
const WhatsappModal = ({ phones, onClose }) => {
  // State to keep track of the currently selected phone number (the local part, formatted for display)
  const [selectedPhone, setSelectedPhone] = useState("");
  // New state for the selected country code, initialized to a common default like +1 or +91
  const [selectedCountryCode, setSelectedCountryCode] = useState("91"); // Default to USA/Canada

  // State to hold the phone numbers after applying the display formatting rules
  const [formattedPhones, setFormattedPhones] = useState([]);

  // Effect to process and set the initial selected phone when the modal opens
  // or if the 'phones' prop changes.
  useEffect(() => {
    if (phones && phones.length > 0) {
      const newFormattedPhones = phones.map((phone) =>
        formatPhoneNumberForDisplay(phone)
      );
      setFormattedPhones(newFormattedPhones);
      // Set the initial selected phone from the *formatted* list
      setSelectedPhone(newFormattedPhones[0]);

      // Optional: Try to infer a default country code if the first phone number
      // gives a hint (e.g., if it started with "91" before formatting)
      const rawFirstPhone = cleanPhoneNumber(phones[0]);
      if (rawFirstPhone.startsWith("91")) {
        setSelectedCountryCode("91");
      } else if (rawFirstPhone.startsWith("44")) {
        // Example: infer UK
        setSelectedCountryCode("44");
      }
      // You can add more inference logic here if needed
    } else {
      setFormattedPhones([]);
      setSelectedPhone(""); // Set to empty if no phones are provided
    }
  }, [phones]); // Dependency array includes 'phones' so it updates if the list changes

  // Handle change in the phone number dropdown selection
  const handlePhoneChange = (event) => {
    setSelectedPhone(event.target.value);
  };

  // Handle change in the country code dropdown selection
  const handleCountryCodeChange = (selectedOption) => {
    setSelectedCountryCode(selectedOption.code);
  };

  // Clean the selected phone number (which is already formatted for display)
  // to ensure it's digits-only for the final WhatsApp link.
  const cleanedPhoneNumberDigits = cleanPhoneNumber(selectedPhone);

  // Generate the full WhatsApp number by combining country code and cleaned local number
  const finalNumberForWhatsapp = `${selectedCountryCode}${cleanedPhoneNumberDigits}`;

  // Generate the WhatsApp link if a valid number was formed
  const whatsappUrl = cleanedPhoneNumberDigits
    ? `https://wa.me/${finalNumberForWhatsapp}`
    : "";

  // Basic check: if no phones are provided, maybe render nothing or a message
  if (!phones || phones.length === 0) {
    return null; // Or render a simple message like "No phone numbers available"
  }

  return (
    // Overlay: Fixed position, full screen, dim background, center content
    <div
      className="fixed inset-0 -top-6 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose} // Close modal when clicking outside the content
    >
      {/* Modal Content: White background, padding, rounded corners, shadow */}
      {/* Stop propagation to prevent closing when clicking inside the modal content */}
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Title */}
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Select WhatsApp Number
        </h2>

        {/* Country Code Dropdown */}
        <div className="mb-4">
          <label
            htmlFor="country-code-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Country Code:
          </label>
          <Select
            id="country-code-select"
            className="react-select-container"
            classNamePrefix="react-select"
            options={countryCodes} // using your original array
            getOptionLabel={(e) => e.name}
            getOptionValue={(e) => e.code}
            value={countryCodes.find((c) => c.code === selectedCountryCode)}
            onChange={handleCountryCodeChange}
            isSearchable
          />
        </div>

        {/* Phone Number Dropdown Container */}
        <div className="mb-4">
          <label
            htmlFor="phone-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Choose a number:
          </label>
          <select
            id="phone-select"
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            value={selectedPhone}
            onChange={handlePhoneChange}
          >
            {/* Map through the *formattedPhones* array to create options */}
            {formattedPhones.map((phone, index) => (
              <option key={index} value={phone}>
                {phone}
              </option>
            ))}
          </select>
        </div>

        {/* WhatsApp Link Button */}
        {/* Only show the link if a valid whatsappUrl was generated */}
        {whatsappUrl ? (
          <div className="mt-6">
            <a
              href={whatsappUrl}
              target="_blank" // Open link in a new tab
              rel="noopener noreferrer" // Recommended for security when using target="_blank"
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Message on WhatsApp ({selectedCountryCode} {selectedPhone})
            </a>
          </div>
        ) : (
          // Optional: Display a message if no number is selected or valid
          <div className="mt-6 text-center text-gray-600 text-sm">
            Select a number and country code to create the WhatsApp link.
          </div>
        )}

        {/* Close Button */}
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            type="button"
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsappModal;
