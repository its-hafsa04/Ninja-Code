const { VM } = require('vm2');

class CodeValidator {
  static validateJavaScript(problem, code) {
    const vm = new VM({
      timeout: 1000,
      sandbox: {}
    });

    try {
      const validationWrapper = this.getValidationWrapper(problem, code);
      
      const testResults = vm.run(validationWrapper);
      
      return {
        allPassed: testResults.every(result => result.passed),
        results: testResults,
        passedCount: testResults.filter(result => result.passed).length,
        totalCount: testResults.length
      };
    } catch (error) {
      console.log(error);
      throw new Error(`Validation error: ${error.message}`);
    }
  }

  static getValidationWrapper(problem, code) {
    const utilityFunctions = `
      // Array comparison function
      function compareArrays(arr1, arr2) {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;
        if (arr1.length !== arr2.length) return false;
        const sorted1 = [...arr1].sort((a, b) => a - b);
        const sorted2 = [...arr2].sort((a, b) => a - b);
        return sorted1.every((val, idx) => val === sorted2[idx]);
      }

      // LinkedList node constructor
      function ListNode(val, next) {
        this.val = (val === undefined ? 0 : val);
        this.next = (next === undefined ? null : next);
      }

      // Convert array to LinkedList
      function arrayToList(arr) {
        if (!arr || !arr.length) return null;
        const head = new ListNode(arr[0]);
        let current = head;
        for (let i = 1; i < arr.length; i++) {
          current.next = new ListNode(arr[i]);
          current = current.next;
        }
        return head;
      }

      // Convert LinkedList to array
      function listToArray(head) {
        const result = [];
        let current = head;
        while (current !== null) {
          result.push(current.val);
          current = current.next;
        }
        return result;
      }
    `;

    const baseWrapper = `
      ${utilityFunctions}
      ${code}
      
      const testCases = ${JSON.stringify(problem.testCases)};
      const results = testCases.map(testCase => {
        try {
    `;

    const problemValidators = {
      problem1: `
          const args = JSON.parse(testCase.input);
          const expectedOutput = JSON.parse(testCase.expectedOutput);
          const actualOutput = twoSum(...args);
          const passed = compareArrays(actualOutput, expectedOutput);
      `,
      problem2: `
          const args = JSON.parse(testCase.input);
          const expectedOutput = JSON.parse(testCase.expectedOutput);
          const actualOutput = isPalindrome(args);
          const passed = actualOutput === expectedOutput;
      `,
      problem3: `
          // Remove Duplicates - handle array modification and length return
          const input = JSON.parse(testCase.input);
          const nums = [...input];
          const actualLength = removeDuplicates(nums);
          const expectedLength = parseInt(testCase.expectedOutput);
          
          // Check if the length returned is correct and if the array is properly modified
          const passed = actualLength === expectedLength && 
                        nums.slice(0, actualLength).every((num, i, arr) => 
                          i === 0 || num > arr[i-1]);
          
          const actualOutput = actualLength;
      `,
      problem4: `
          const args = JSON.parse(testCase.input);
          const expectedOutput = JSON.parse(testCase.expectedOutput);
          const actualOutput = search(...args);
          const passed = actualOutput === expectedOutput;
      `,
      problem5: `
          const args = JSON.parse(testCase.input);
          const expectedOutput = JSON.parse(testCase.expectedOutput);
          const actualOutput = maxSubArray(args);
          const passed = actualOutput === expectedOutput;
      `
    };

    return `
      (function() {
        ${baseWrapper}
          ${problemValidators[problem.id] || 'throw new Error("Unknown problem type");'}
          return {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: JSON.stringify(actualOutput),
            passed,
            explanation: testCase.explanation
          };
        } catch (error) {
          return {
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            passed: false,
            error: error.toString(),
            explanation: testCase.explanation
          };
        }
      });
      return results;
    })()`;
  }

  static validate(problem, code, language = 'javascript') {
    switch(language) {
      case 'javascript':
        return this.validateJavaScript(problem, code);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }
}

module.exports = CodeValidator;