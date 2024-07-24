import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
    });

    test("Then bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dateElements = screen.getAllByTestId("bill-date");
      const dates = dateElements.map((el) => el.textContent);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    test("When I click on the new bill button, then I should be redirected to NewBill page", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill);
      const buttonNewBill = screen.getAllByTestId("btn-new-bill")[0]; // Utilisation de getAllByTestId et sélection du premier élément
      buttonNewBill.addEventListener("click", handleClickNewBill);
      fireEvent.click(buttonNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    test("When I click on the eye icon, then a modal should open", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      $.fn.modal = jest.fn(); // Mock jQuery modal function
      const billsContainer = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
      document.body.innerHTML = BillsUI({ data: bills });
      const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye);
      billsContainer.handleClickIconEye = handleClickIconEye; // Mock the method directly
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      iconEye.addEventListener("click", (e) =>
        billsContainer.handleClickIconEye(iconEye)
      );
      fireEvent.click(iconEye);
      expect(handleClickIconEye).toHaveBeenCalled();
      await waitFor(() => screen.getByTestId("modaleFile"));
      expect(screen.getByTestId("modaleFile")).toBeTruthy();
      const images = screen.queryAllByRole("img");
      if (images.length > 0) {
        expect(images[0]).toHaveAttribute("alt", "Bill");
      }
    });

    test("getBills should fetch bills from the mock API and format them correctly", async () => {
      const billsContainer = new Bills({
        document,
        onNavigate: null,
        store: mockStore,
        localStorage: window.localStorage,
      });
      const billsData = await billsContainer.getBills();
      expect(billsData.length).toBe(4);
      expect(billsData[0].date).toBe("4 Avr. 04");
      expect(billsData[0].status).toBe("En attente");
    });
  });
});
