> * 动态数组是C++标准模板库中的`std::vector`，是一个内存连续、可以动态插入和删除元素的数组容器
> * `std::vector`可以自动管理内存，这意味着不需要手动分配和释放内存

## 基础用法

`vector`具有**动态大小**，可以根据需要自动适应；`vector`**可迭代**，支持使用循环来访问`vector`的元素；`vector`可以存储**任何类型**的元素，包括内置数据类型、类对象、指针等，且元素在内存中是**连续存储**的

```c++
#include <iostream>
#include <vector> // std::vector 要用到的库

struct Vertex {
    float x, y, z;
};

std::ostream& operator<<(std::ostream& stream, const Vertex& vertex) {
    stream << vertex.x << ", " << vertex.y << ", " << vertex.z;
    return stream;
}

int main() {
    std::vector<Vertex> vertices; // 创建容器
    vertices.push_back({ 1, 2, 3 }); // 添加元素
    vertices.push_back({ 4, 5, 6 });
    
    for (int i = 0; i < vertices.size(); i++) { // 获取大小
        std::cout << vertices[i] << std::endl; // 访问元素
    }
    // 1, 2, 3
    // 4, 5, 6
    vertices.erase(vertices.begin() + 1); // 删除元素    

    for (Vertex& v: vertices) { // 迭代访问
        std::cout << v << std::endl;
    }
    // 1, 2, 3
    vertices.clear(); // 清空容器（数组大小设为 0）
}
```

* `vector`中存放类对象本身：多个对象连续存储，访问效率较高，但是扩展大小时要全部复制，有复制开销（特别是涉及到字符串）
* `vector`中存放类对象指针：指针连续存储，但类对象本身不一定连续，有访问开销，但是扩展大小时仅需复制各个指针，类对象无需改变

## 使用优化

动态数组的工作原理是，在当前`vector`的空间不足时，分配另一个能满足需求的内存空间，并将所有元素复制到新分配的内存地址处，将原`vector`删除并释放内存，不断添加元素时会带来较大的开销。

另外，使用`push_back`方法添加元素时，本质上是先在当前作用域（`main`函数内）创建新元素，然后将该元素复制到`vector`所在的内存位置中，这也会带来性能上的开销。

```c++
#include <iostream>
#include <vector>

struct Vertex {
    float x, y, z;
    
    Vertex(float x, float y, float z)
        : x(x), y(y), z(z)
    {
    }
    Vertex(const Vertex& other)
        : x(other.x), y(other.y), z(other.y)
    {
        std::cout << "Copied!" << std::endl;
    }
};

int main() {
    std::vector<Vertex> vertices;
    // vertices.push_back({ 1, 2, 3 });
    // Copied! * 1
    // vertices.push_back({ 4, 5, 6 });
    // Copied! * 2
    // vertices.push_back({ 7, 8, 9 });
    // Copied! * 3
    
    vertices.reserve(3);
    vertices.emplace_back(1, 2, 3);
    vertices.emplace_back(4, 5, 6);
    vertices.emplace_back(7, 8, 9);
}
```

* 仅使用`push_back`直接添加对象元素时，每个元素加入`vector`均需要一次复制，且在`vector`扩展大小时也会把原动态数组中的元素复制到新的地址，所以一共会触发`6`次拷贝构造函数的调用
* 可以使用`reserve`方法**提前声明**需要用到的`vector`的**大小**，避免扩展规模带来的复制开销，可以减少`3`次
* 可以使用`emplace_back`替代`push_back`添加元素，该方法实际上**仅会传递构造所需的参数列表**，然后在`vector`内直接创建新的元素，可以减少`3`次拷贝构造函数的调用