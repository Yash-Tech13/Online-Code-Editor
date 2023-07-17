import React, { useState, useEffect } from "react";
import CodeEditorWindow from "./codeEditorWindow";
import { languageOptions } from "../constants/languageOptions";
import axios from "axios";
import {classnames} from "../utils/general";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { defineTheme } from "../lib/defineTheme";
import useKeyPress from "../hooks/useKeyPress";

import LanguageDropdown from "./languageDropdown";
import ThemeDropdown from "./themeDropdown";
import OutputWindow from "./outputWindow";
import OutputDetails from "./outputDetails";
import CustomInput from "./customInput";

const javascriptDefault = `//C++ Boilerplate
#include <bits/stdc++.h>
using namespace std;

int main() {
    //Write your code here
    
    return 0;
}
`;
const Landing = () => {
  const [code, setCode] = useState(javascriptDefault);
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [processing, setProcessing] = useState(null);
  const [theme, setTheme] = useState("cobalt");
  const [language, setLanguage] = useState(languageOptions[0]);

  const enterPress = useKeyPress("Enter");
  const ctrlPress = useKeyPress("Control");

  const onSelectChange = (sl) => {
    setLanguage(sl);
  };

  useEffect(() => {
    if (enterPress && ctrlPress) {
      console.log("enterPress", enterPress);
      console.log("ctrlPress", ctrlPress);
      handleCompile();
    }
  }, [ctrlPress, enterPress]);

  const handleCompile = () => {
    setProcessing(true);
    const formData = {
      language_id: language.id,
      //Encode the source code in base64
      source_code: btoa(code),
      stdin: btoa(customInput),
    };

    const options = {
      method: "POST",
      url: process.env.REACT_APP_RAPID_API_URL,
      params: { base64_encoded: "true", fields:"*"},
      headers: {
        "content-type": "application/json",
        "Content-Type": "application/json",
        "X-RapidAPI-Key": process.env.REACT_APP_RAPID_API_KEY, 
        "X-RapidAPI-Host": process.env.REACT_APP_RAPID_API_HOST, 
      },
      data: formData,
    };

    axios
      .request(options)
      .then(function(response) {
        console.log("res-data",response.data);
        const token = response.data.token;
        checkStatus(token);
      })
      .catch((err) => {
        let error = err.response ? err.response.data : err;
        setProcessing(false);
        console.log(error);
      });
  };

  const checkStatus = async (token) => {
      const options = {
        method:"GET",
        url: process.env.REACT_APP_RAPID_API_URL + "/" + token,
        params: { base64_encoded: "true", fields: "*"},
        headers: {
            "X-RapidAPI-Key": process.env.REACT_APP_RAPID_API_KEY, 
            "X-RapidAPI-Host": process.env.REACT_APP_RAPID_API_HOST,
          },
      };

      try {
        let response = await axios.request(options);
        let statusId = response.data.status?.id;

        if(statusId === 1 || statusId === 2) {
            // Still Processing
            setTimeout(() => {
                checkStatus(token)
            }, 2000);
            return;
        } else {
            // Processed
            setProcessing(false);
            setOutputDetails(response.data);
            showSuccessToast(`Compiled Successfully!`);
            console.log("res.data", response.data);
            return;
        }
      } catch (err) {
        console.log("err", err);
        setProcessing(false);
        showErrorToast();
      }
  };
  
  const onChange = (action, data) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };

  function handleThemeChange(th) {
    const theme = th;
    if(["light","vs-dark"].includes(theme.value)) {
      setTheme(theme);
    } else {
      defineTheme(theme.value).then((_) => setTheme(theme));
    }
  }
  useEffect(() => {
    defineTheme("oceanic-next").then((_) =>
      setTheme({ value: "oceanic-next", label: "Oceanic Next" })
    );
  }, []);

  const showSuccessToast = (msg) => {
    toast.success(msg || `Compiled Successfully!`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };
  const showErrorToast = (msg) => {
    toast.error(msg || `Something went wrong! Please try again.`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="h-12 w-full bg-[#27374D] shadow-2xl">
        <h1 className="px-2 py-2 text-white text-xl">Online Code Editor</h1>
      </div>
      <div className="flex flex-row bg-[#9DB2BF]">
        <div className="px-4 py-2">
          <LanguageDropdown onSelectChange={onSelectChange} />
        </div>
        <div className="px-4 py-2">
          <ThemeDropdown handleThemeChange={handleThemeChange} theme={theme} />
        </div>
      </div>

      <div className="flex flex-row space-x-4 items-start px-4 py-4 bg-[#9DB2BF]">
        <div className="flex flex-col w-full h-full justify-start items-end">
          <CodeEditorWindow
            code={code}
            onChange={onChange}
            language={language?.value}
            theme={theme.value}
          />
        </div>

        <div className="right-container flex flex-shrink-0 w-[30%] flex-col">
          <OutputWindow outputDetails={outputDetails} />
          <div className="flex flex-col items-end">
            <CustomInput
              customInput={customInput}
              setCustomInput={setCustomInput}
            />
            <button
              onClick={handleCompile}
              disabled={!code}
              className={classnames(
                "mt-4 text-white border-2 border-black z-10 rounded-md shadow-[5px_5px_0px_0px_rgba(0,0,0)] px-4 py-2 hover:shadow transition duration-200 bg-[#27374D] flex-shrink-0",
                !code ? "opacity-50" : ""
              )}
            >
              {processing ? "Processing..." : "Compile and Execute"}
            </button>
          </div>
          {outputDetails && <OutputDetails outputDetails={outputDetails} />}
        </div>
      </div>
    </>
  );
};

export default Landing;
