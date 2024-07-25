/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let newBill;
    beforeEach(() => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a.com",
        })
      );
      newBill = new NewBill({
        document,
        onNavigate: (pathname) =>
          (document.body.innerHTML = ROUTES({ pathname })),
        store: mockStore,
        localStorage: window.localStorage,
      });
    });

    test("Then the form should be rendered", () => {
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });

    describe("When I upload a file", () => {
      test("Then it should call handleChangeFile and update fileUrl and fileName if the file is valid", async () => {
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const fileInput = screen.getByTestId("file");
        const file = new File(["test"], "test.jpg", { type: "image/jpg" });

        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(handleChangeFile).toHaveBeenCalled());

        // Mock the store's create method
        const createMock = jest.spyOn(mockStore.bills(), "create");
        createMock.mockResolvedValueOnce({
          fileUrl: "https://example.com/test.jpg",
          key: "1234",
        });

        // Manually trigger the change event again to simulate the store response
        await newBill.handleChangeFile({
          target: { value: "C:\\fakepath\\test.jpg", files: [file] },
          preventDefault: jest.fn(), // Mock preventDefault
        });

        expect(newBill.fileName).toBe("test.jpg");
        expect(newBill.fileUrl).toBe("https://example.com/test.jpg");
      });

      test("Then it should alert and reset the input if the file is invalid", async () => {
        jest.spyOn(window, "alert").mockImplementation(() => {});
        const handleChangeFile = jest.fn(newBill.handleChangeFile);
        const fileInput = screen.getByTestId("file");
        const file = new File(["test"], "test.txt", { type: "text/plain" });

        fileInput.addEventListener("change", handleChangeFile);
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(handleChangeFile).toHaveBeenCalled());
        expect(window.alert).toHaveBeenCalledWith(
          "Seuls les fichiers avec les extensions jpg, jpeg ou png sont autorisés."
        );
        expect(fileInput.value).toBe("");
      });
    });

    describe("When I submit the form", () => {
      test("Then it should call handleSubmit and navigate to Bills page", async () => {
        const handleSubmit = jest.fn(newBill.handleSubmit);
        const form = screen.getByTestId("form-new-bill");

        // Remplir le formulaire avec des valeurs de test
        screen.getByTestId("expense-type").value = "Transports";
        screen.getByTestId("expense-name").value = "Test expense";
        screen.getByTestId("amount").value = "100";
        screen.getByTestId("datepicker").value = "2022-01-01";
        screen.getByTestId("vat").value = "20";
        screen.getByTestId("pct").value = "20";
        screen.getByTestId("commentary").value = "Test commentary";
        newBill.fileUrl = "https://example.com/test.jpg";
        newBill.fileName = "test.jpg";

        form.addEventListener("submit", handleSubmit);
        fireEvent.submit(form);

        await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
        expect(screen.queryByTestId("form-new-bill")).toBe(null); // Vérifier que la page a changé
      });
    });

    describe("When I call updateBill", () => {
      test("Then it should update the bill in the store", async () => {
        const updateMock = jest.spyOn(mockStore.bills(), "update");
        updateMock.mockResolvedValueOnce({});

        const bill = {
          email: "a@a.com",
          type: "Transports",
          name: "Test expense",
          amount: 100,
          date: "2022-01-01",
          vat: "20",
          pct: 20,
          commentary: "Test commentary",
          fileUrl: "https://example.com/test.jpg",
          fileName: "test.jpg",
          status: "pending",
        };

        newBill.billId = "1234"; // Assurer que billId est défini
        newBill.updateBill(bill);

        expect(updateMock).toHaveBeenCalledWith({
          data: JSON.stringify(bill),
          selector: "1234",
        });
      });
    });
  });
});
