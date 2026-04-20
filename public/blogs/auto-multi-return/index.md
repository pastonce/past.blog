## auto关键字

`auto`关键字可以让编译器**自动推导变量类型**并应用，包括但不限于定义变量、接收函数返回值等场景

```c++
#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>

std::string GetName() {
    return "Past";
}

class Device {};

class DeviceManager {
private:
    std::unordered_map<std::string, std::vector<Device*>> m_Devices;
public:
    const std::unordered_map<std::string, std::vector<Device*>>& GetDevices() const {
        return m_Devices;
    }
};

int main() {
    auto a = 5; // 定义变量
    auto str = GetName(); // 接收函数返回值
    
    std::vector<std::string> strings;
    strings.push_back("Apple");
    strings.push_back("Orange");
    
    // for(std::vector<std::string>::iterator it = strings.begin(); it != strings.end(); it++)
    for (auto it = strings.begin(); it != strings.end(); it++) { // 推导 iterator 类型，最常用
        std::cout << *it << std::endl;
    }
    
    DeviceManager dm;
    const auto& devices = dm.GetDevices(); // 超长类型
}
```

* 仅用`auto`关键字接收一个引用时，并**不会进行引用**而是会复制，所以仍要加上`&`符号
* 使用`atuo`关键字无需指定变量类型的同时，也失去了隐式转换的优势，而且代码改变时变量类型会自动适应，更难进行debug，不能一眼看出变量类型使代码可读性下降
* 一般在`iterator`类型和**超长但仅用一次**的类型处使用`auto`关键字

## 如何处理多返回值

C++普通函数默认不支持返回多个返回值，但可以通过一些方法实现返回不同类型的多个返回值：

* `void`函数写入返回值参数：`void function(原参数，返回值1的引用或指针，返回值2的引用或指针)`，仅需在得到结果后依次设置这两个参数指向的值即可
    * 需要事先定义需要用到的值并传入引用或地址
    * 避免了参数复制带来的性能问题
    * 使用指针时还支持传入`nullptr`不返回参数，更加灵活
* 返回数组：返回包含多个返回值的数组（原始数组、`std::array`或`std::vector`），通过同类型指针接收
    * 返回原始数组或`std::vector`时需要在堆上创建，存在一定性能问题
    * 返回原始数组时接收后不知道数组的长度即返回值的数量
    * 不支持不同类型的返回值
* 返回元组：返回包含多个返回值的元组`std::tuple`或包含两个返回值的`std::pair`
    * 支持不同类型的返回值
    * 取值需要用`std::get<索引>(元组)`或`pair.first/pair.second`，可读性差
* **返回结构体**：定义包含多个返回值的结构体，返回时**借助隐式转换**仅需`return { 返回值1, 返回值2, 返回值3, ... };`
    * 支持不同数量不同类型的返回值
    * 结构体在栈上创建，性能较优
    * 可以在结构体内对各返回值进行命名，语义上易读易用